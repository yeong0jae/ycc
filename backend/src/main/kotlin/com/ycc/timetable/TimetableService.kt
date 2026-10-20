package com.ycc.timetable

import com.ycc.notice.NoticeImageStorage
import com.ycc.notice.UploadedImage
import com.ycc.organizer.OrganizerRepository
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

data class StageResponse(val id: Long, val name: String)

data class SlotResponse(val id: Long, val stageId: Long, val day: LocalDate, val start: Int, val end: Int, val artist: String)

data class TimetableImageResponse(val id: Long, val day: LocalDate, val url: String, val width: Int, val height: Int)

data class TimetableResponse(
	val published: Boolean,
	val days: List<LocalDate>,
	val stages: List<StageResponse>,
	val slots: List<SlotResponse>,
	val images: List<TimetableImageResponse>,
)

data class StageRequest(val name: String)

data class StageOrderRequest(val stageIds: List<Long>)

data class SlotRequest(val stageId: Long, val day: LocalDate, val start: Int, val end: Int, val artist: String)

data class PublishRequest(val published: Boolean)

@Service
@Transactional
class TimetableService(
	private val stageRepository: TimetableStageRepository,
	private val slotRepository: TimetableSlotRepository,
	private val imageRepository: TimetableImageRepository,
	private val organizerRepository: OrganizerRepository,
	private val showRepository: ShowRepository,
	private val storage: NoticeImageStorage,
	private val clock: Clock,
) {

	@Transactional(readOnly = true)
	fun showTimetable(showId: Long): TimetableResponse {
		val show = showRepository.findById(showId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		return response(show, includeSlots = show.timetablePublished)
	}

	@Transactional(readOnly = true)
	fun organizerTimetable(organizerId: Long, showId: Long) = response(ownedShow(organizerId, showId), includeSlots = true)

	fun addStage(organizerId: Long, showId: Long, request: StageRequest): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		val position = stageRepository.findByShowIdOrderByPositionAscIdAsc(showId).size
		stageRepository.save(TimetableStage(show, stageName(request.name), position))
		return response(show, includeSlots = true)
	}

	fun renameStage(organizerId: Long, showId: Long, stageId: Long, request: StageRequest): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		ownedStage(showId, stageId).name = stageName(request.name)
		return response(show, includeSlots = true)
	}

	fun deleteStage(organizerId: Long, showId: Long, stageId: Long): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		val stage = ownedStage(showId, stageId)
		slotRepository.deleteByStageId(stage.id)
		stageRepository.delete(stage)
		stageRepository.flush()
		return response(show, includeSlots = true)
	}

	fun reorderStages(organizerId: Long, showId: Long, request: StageOrderRequest): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		val stages = stageRepository.findByShowIdOrderByPositionAscIdAsc(showId).associateBy { it.id }
		if (request.stageIds.toSet() != stages.keys) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "무대 목록이 맞지 않아요.")
		request.stageIds.forEachIndexed { index, id -> stages.getValue(id).position = index }
		return response(show, includeSlots = true)
	}

	fun addSlot(organizerId: Long, showId: Long, request: SlotRequest): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		validate(show, request)
		slotRepository.save(TimetableSlot(show, ownedStage(showId, request.stageId), request.day, request.start, request.end, request.artist.trim()))
		return response(show, includeSlots = true)
	}

	fun updateSlot(organizerId: Long, showId: Long, slotId: Long, request: SlotRequest): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		validate(show, request)
		val slot = ownedSlot(showId, slotId)
		slot.stage = ownedStage(showId, request.stageId)
		slot.day = request.day
		slot.startMinute = request.start
		slot.endMinute = request.end
		slot.artist = request.artist.trim()
		return response(show, includeSlots = true)
	}

	fun deleteSlot(organizerId: Long, showId: Long, slotId: Long): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		slotRepository.delete(ownedSlot(showId, slotId))
		slotRepository.flush()
		return response(show, includeSlots = true)
	}

	fun publish(organizerId: Long, showId: Long, request: PublishRequest): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		show.timetablePublished = request.published
		return response(show, includeSlots = true)
	}

	fun uploadImage(organizerId: Long, showId: Long, day: LocalDate, bytes: ByteArray, contentType: String?): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		requireDay(show, day)
		val position = imageRepository.countByShowIdAndDay(showId, day)
		if (position >= MAX_IMAGES_PER_DAY) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "공식 이미지는 하루에 ${MAX_IMAGES_PER_DAY}장까지 올릴 수 있어요.")
		}
		val image = UploadedImage.read(bytes, contentType)
		val key = "timetables/$showId/${UUID.randomUUID()}.${image.extension}"
		val url = storage.put(key, image.bytes, image.contentType)
		imageRepository.save(TimetableImage(show, day, position, key, url, image.width, image.height, LocalDateTime.now(clock)))
		return response(show, includeSlots = true)
	}

	fun deleteImage(organizerId: Long, showId: Long, imageId: Long): TimetableResponse {
		val show = ownedShow(organizerId, showId)
		val image = imageRepository.findById(imageId).orElse(null)?.takeIf { it.show.id == showId }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
		storage.delete(image.storageKey)
		imageRepository.delete(image)
		imageRepository.flush()
		return response(show, includeSlots = true)
	}

	private fun response(show: Show, includeSlots: Boolean) = TimetableResponse(
		published = show.timetablePublished,
		days = generateSequence(show.startDate) { it.plusDays(1) }.takeWhile { it <= show.endDate }.toList(),
		stages = stageRepository.findByShowIdOrderByPositionAscIdAsc(show.id).map { StageResponse(it.id, it.name) },
		slots = if (!includeSlots) {
			emptyList()
		} else {
			slotRepository.findByShowIdOrderByDayAscStartMinuteAscIdAsc(show.id)
				.map { SlotResponse(it.id, it.stage.id, it.day, it.startMinute, it.endMinute, it.artist) }
		},
		images = imageRepository.findByShowIdOrderByDayAscPositionAscIdAsc(show.id)
			.map { TimetableImageResponse(it.id, it.day, it.url, it.width, it.height) },
	)

	private fun validate(show: Show, request: SlotRequest) {
		requireDay(show, request.day)
		val artist = request.artist.trim()
		if (artist.isEmpty() || artist.length > MAX_ARTIST) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "출연은 1~${MAX_ARTIST}자로 적어 주세요.")
		}
		if (request.start < 0 || request.end > MAX_MINUTE || request.start >= request.end) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "시작은 끝보다 앞이어야 하고, 끝은 다음 날 06:00(30:00)까지예요.")
		}
	}

	private fun requireDay(show: Show, day: LocalDate) {
		if (day < show.startDate || day > show.endDate) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "공연 기간 안의 날짜만 고를 수 있어요.")
		}
	}

	private fun stageName(name: String): String {
		val trimmed = name.trim()
		if (trimmed.isEmpty() || trimmed.length > MAX_STAGE_NAME) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "무대 이름은 1~${MAX_STAGE_NAME}자로 적어 주세요.")
		}
		return trimmed
	}

	private fun ownedShow(organizerId: Long, showId: Long): Show {
		val organizer = organizerRepository.findById(organizerId).orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED) }
		if (organizer.show.id != showId) throw ResponseStatusException(HttpStatus.FORBIDDEN)
		return organizer.show
	}

	private fun ownedStage(showId: Long, stageId: Long) =
		stageRepository.findById(stageId).orElse(null)?.takeIf { it.show.id == showId }
			?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "없는 무대예요.")

	private fun ownedSlot(showId: Long, slotId: Long) =
		slotRepository.findById(slotId).orElse(null)?.takeIf { it.show.id == showId }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	companion object {
		private const val MAX_STAGE_NAME = 30
		private const val MAX_ARTIST = 100
		private const val MAX_MINUTE = 30 * 60
		private const val MAX_IMAGES_PER_DAY = 6
	}
}
