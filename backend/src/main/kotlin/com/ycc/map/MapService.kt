package com.ycc.map

import com.ycc.notice.NoticeImageStorage
import com.ycc.notice.UploadedImage
import com.ycc.organizer.OrganizerRepository
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import com.ycc.timetable.TimetableStage
import com.ycc.timetable.TimetableStageRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDateTime
import java.util.UUID

data class MapImageResponse(val id: Long, val url: String, val width: Int, val height: Int, val crop: Crop?)

data class PinResponse(
	val id: Long,
	val imageId: Long,
	val kind: PinKind,
	val name: String,
	val description: String?,
	val x: Double,
	val y: Double,
	val stageId: Long?,
	val ai: Boolean,
)

data class MapStageResponse(val id: Long, val name: String)

data class MapResponse(
	val published: Boolean,
	val aiAvailable: Boolean,
	val images: List<MapImageResponse>,
	val pins: List<PinResponse>,
	val stages: List<MapStageResponse>,
)

data class PinRequest(
	val kind: PinKind,
	val name: String,
	val description: String? = null,
	val x: Double,
	val y: Double,
	val stageId: Long? = null,
)

data class MapPublishRequest(val published: Boolean)

data class CropRequest(val x: Double, val y: Double, val w: Double, val h: Double)

@Service
@Transactional
class MapService(
	private val imageRepository: MapImageRepository,
	private val pinRepository: MapPinRepository,
	private val stageRepository: TimetableStageRepository,
	private val organizerRepository: OrganizerRepository,
	private val showRepository: ShowRepository,
	private val storage: NoticeImageStorage,
	private val finder: MapPinFinder,
	private val clock: Clock,
) {

	private val log = LoggerFactory.getLogger(javaClass)

	@Transactional(readOnly = true)
	fun showMap(showId: Long): MapResponse {
		val show = showRepository.findById(showId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		return response(show, includePins = show.mapPublished)
	}

	@Transactional(readOnly = true)
	fun organizerMap(organizerId: Long, showId: Long) = response(ownedShow(organizerId, showId), includePins = true)

	fun uploadImage(organizerId: Long, showId: Long, bytes: ByteArray, contentType: String?): MapResponse {
		val show = ownedShow(organizerId, showId)
		val position = imageRepository.findByShowIdOrderByPositionAscIdAsc(showId).size
		if (position >= MAX_IMAGES) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "맵 이미지는 ${MAX_IMAGES}장까지 올릴 수 있어요.")
		val image = UploadedImage.read(bytes, contentType)
		val key = "maps/$showId/${UUID.randomUUID()}.${image.extension}"
		val url = storage.put(key, image.bytes, image.contentType)
		imageRepository.save(MapImage(show, position, key, url, image.width, image.height, LocalDateTime.now(clock)))
		return response(show, includePins = true)
	}

	fun deleteImage(organizerId: Long, showId: Long, imageId: Long): MapResponse {
		val show = ownedShow(organizerId, showId)
		val image = ownedImage(showId, imageId)
		pinRepository.deleteByImageId(image.id)
		storage.delete(image.storageKey)
		imageRepository.delete(image)
		imageRepository.flush()
		imageRepository.findByShowIdOrderByPositionAscIdAsc(showId).forEachIndexed { index, it -> it.position = index }
		return response(show, includePins = true)
	}

	fun findPins(organizerId: Long, showId: Long): MapResponse {
		val show = ownedShow(organizerId, showId)
		if (!finder.available) throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "지금은 AI로 장소를 찾을 수 없어요.")
		val image = imageRepository.findByShowIdOrderByPositionAscIdAsc(showId).firstOrNull()
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "먼저 맵 이미지를 올려 주세요.")
		val found = runCatching { finder.find(storage.read(image.storageKey), contentTypeOf(image.storageKey)) }
			.onFailure { log.error("맵 AI 장소 찾기 실패", it) }
			.getOrElse { throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI가 장소를 찾지 못했어요. 잠시 뒤에 다시 시도해 주세요.") }
		image.setCrop(found.area)
		pinRepository.deleteByImageId(image.id)
		pinRepository.flush()
		val stages = stageRepository.findByShowIdOrderByPositionAscIdAsc(showId)
		val now = LocalDateTime.now(clock)
		found.pins.forEach {
			pinRepository.save(MapPin(show, image, it.kind, it.name, null, it.x, it.y, if (it.kind == PinKind.STAGE) matchStage(stages, it.name) else null, true, now))
		}
		return response(show, includePins = true)
	}

	fun cropImage(organizerId: Long, showId: Long, imageId: Long, request: CropRequest): MapResponse {
		val show = ownedShow(organizerId, showId)
		val image = ownedImage(showId, imageId)
		val valid = request.x >= 0 && request.y >= 0 && request.w > 0.05 && request.h > 0.05 && request.x + request.w <= 1.0001 && request.y + request.h <= 1.0001
		if (!valid) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "보여 줄 범위를 이미지 안에서 정해 주세요.")
		image.setCrop(Crop(request.x, request.y, request.w.coerceAtMost(1 - request.x), request.h.coerceAtMost(1 - request.y)))
		return response(show, includePins = true)
	}

	fun addPin(organizerId: Long, showId: Long, request: PinRequest): MapResponse {
		val show = ownedShow(organizerId, showId)
		val image = imageRepository.findByShowIdOrderByPositionAscIdAsc(showId).firstOrNull()
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "먼저 맵 이미지를 올려 주세요.")
		val (name, description) = validate(request)
		pinRepository.save(MapPin(show, image, request.kind, name, description, request.x, request.y, stageOf(showId, request), false, LocalDateTime.now(clock)))
		return response(show, includePins = true)
	}

	fun updatePin(organizerId: Long, showId: Long, pinId: Long, request: PinRequest): MapResponse {
		val show = ownedShow(organizerId, showId)
		val pin = ownedPin(showId, pinId)
		val (name, description) = validate(request)
		pin.kind = request.kind
		pin.name = name
		pin.description = description
		pin.x = request.x
		pin.y = request.y
		pin.stage = stageOf(showId, request)
		return response(show, includePins = true)
	}

	fun deletePin(organizerId: Long, showId: Long, pinId: Long): MapResponse {
		val show = ownedShow(organizerId, showId)
		pinRepository.delete(ownedPin(showId, pinId))
		pinRepository.flush()
		return response(show, includePins = true)
	}

	fun publish(organizerId: Long, showId: Long, request: MapPublishRequest): MapResponse {
		val show = ownedShow(organizerId, showId)
		show.mapPublished = request.published
		return response(show, includePins = true)
	}

	private fun response(show: Show, includePins: Boolean) = MapResponse(
		published = show.mapPublished,
		aiAvailable = finder.available,
		images = imageRepository.findByShowIdOrderByPositionAscIdAsc(show.id).map { MapImageResponse(it.id, it.url, it.width, it.height, it.crop()) },
		pins = if (!includePins) {
			emptyList()
		} else {
			pinRepository.findByShowIdOrderByIdAsc(show.id).map { PinResponse(it.id, it.image.id, it.kind, it.name, it.description, it.x, it.y, it.stage?.id, it.ai) }
		},
		stages = stageRepository.findByShowIdOrderByPositionAscIdAsc(show.id).map { MapStageResponse(it.id, it.name) },
	)

	private fun validate(request: PinRequest): Pair<String, String?> {
		val name = request.name.trim()
		if (name.isEmpty() || name.length > MAX_NAME) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 1~${MAX_NAME}자로 적어 주세요.")
		val description = request.description?.trim()?.ifBlank { null }
		if (description != null && description.length > MAX_DESCRIPTION) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "설명은 ${MAX_DESCRIPTION}자까지 적을 수 있어요.")
		}
		if (request.x !in 0.0..1.0 || request.y !in 0.0..1.0) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "맵 안에 찍어 주세요.")
		return name to description
	}

	private fun stageOf(showId: Long, request: PinRequest): TimetableStage? {
		if (request.kind != PinKind.STAGE || request.stageId == null) return null
		return stageRepository.findById(request.stageId).orElse(null)?.takeIf { it.show.id == showId }
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "없는 무대예요.")
	}

	private fun matchStage(stages: List<TimetableStage>, name: String): TimetableStage? {
		val key = normalize(name)
		return stages.firstOrNull { normalize(it.name) == key } ?: stages.firstOrNull { key.contains(normalize(it.name)) }
	}

	private fun normalize(name: String) = name.lowercase().filterNot { it.isWhitespace() }.removeSuffix("stage").removeSuffix("무대").removeSuffix("스테이지")

	private fun contentTypeOf(key: String) = if (key.endsWith(".png")) "image/png" else "image/jpeg"

	private fun ownedShow(organizerId: Long, showId: Long): Show {
		val organizer = organizerRepository.findById(organizerId).orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED) }
		if (organizer.show.id != showId) throw ResponseStatusException(HttpStatus.FORBIDDEN)
		return organizer.show
	}

	private fun ownedImage(showId: Long, imageId: Long) =
		imageRepository.findById(imageId).orElse(null)?.takeIf { it.show.id == showId } ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	private fun ownedPin(showId: Long, pinId: Long) =
		pinRepository.findById(pinId).orElse(null)?.takeIf { it.show.id == showId } ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	private fun MapImage.crop() = if (cropX != null && cropY != null && cropW != null && cropH != null) Crop(cropX!!, cropY!!, cropW!!, cropH!!) else null

	private fun MapImage.setCrop(crop: Crop?) {
		cropX = crop?.x
		cropY = crop?.y
		cropW = crop?.w
		cropH = crop?.h
	}

	companion object {
		private const val MAX_IMAGES = 4
		private const val MAX_NAME = 60
		private const val MAX_DESCRIPTION = 300
	}
}
