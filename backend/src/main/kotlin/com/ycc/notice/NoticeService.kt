package com.ycc.notice

import com.ycc.organizer.Organizer
import com.ycc.organizer.OrganizerRepository
import com.ycc.show.ReviewStatus
import com.ycc.show.ShowRepository
import com.ycc.show.ShowResponse
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.Duration
import java.time.LocalDateTime
import java.util.UUID

data class NoticeImageResponse(val id: Long, val url: String, val width: Int, val height: Int) {
	companion object {
		fun from(image: NoticeImage) = NoticeImageResponse(image.id, image.url, image.width, image.height)
	}
}

data class NoticeResponse(
	val id: Long,
	val kind: NoticeKind,
	val title: String,
	val body: String?,
	val images: List<NoticeImageResponse>,
	val organizerName: String,
	val createdAt: LocalDateTime,
	val updatedAt: LocalDateTime?,
) {
	companion object {
		fun from(notice: Notice) = NoticeResponse(
			notice.id,
			notice.kind,
			notice.title,
			notice.body,
			notice.images.map(NoticeImageResponse::from),
			notice.organizer.displayName,
			notice.createdAt,
			notice.updatedAt,
		)
	}
}

data class ShowNoticesResponse(val urgent: NoticeResponse?, val items: List<NoticeResponse>, val total: Int)

data class NoticeRequest(val kind: NoticeKind, val title: String, val body: String?, val imageIds: List<Long> = emptyList())

data class LatestNoticeResponse(val kind: NoticeKind, val title: String, val createdAt: LocalDateTime)

data class ParticipatedShowResponse(val show: ShowResponse, val latestNotice: LatestNoticeResponse?, val noticeCount: Int)

@Service
@Transactional
class NoticeService(
	private val noticeRepository: NoticeRepository,
	private val noticeImageRepository: NoticeImageRepository,
	private val organizerRepository: OrganizerRepository,
	private val showRepository: ShowRepository,
	private val storage: NoticeImageStorage,
	private val clock: Clock,
) {

	@Transactional(readOnly = true)
	fun showNotices(showId: Long): ShowNoticesResponse {
		val notices = noticeRepository.findVisibleByShowId(showId)
		val urgent = notices.firstOrNull { it.kind == NoticeKind.URGENT }
		return ShowNoticesResponse(
			urgent = urgent?.let(NoticeResponse::from),
			items = notices.filter { it !== urgent }.map(NoticeResponse::from),
			total = notices.size,
		)
	}

	@Transactional(readOnly = true)
	fun participated(showIds: List<Long>): List<ParticipatedShowResponse> {
		val ids = showIds.distinct().take(MAX_PARTICIPATED)
		val shows = showRepository.findAllById(ids).filter { it.reviewStatus == ReviewStatus.VISIBLE }
		val notices = noticeRepository.findVisibleByShowIds(shows.map { it.id }).groupBy { it.show.id }
		return shows.sortedWith(compareBy({ it.startDate }, { it.id })).map { show ->
			val showNotices = notices[show.id].orEmpty()
			ParticipatedShowResponse(
				show = ShowResponse.from(show),
				latestNotice = showNotices.firstOrNull()?.let { LatestNoticeResponse(it.kind, it.title, it.createdAt) },
				noticeCount = showNotices.size,
			)
		}
	}

	@Transactional(readOnly = true)
	fun organizerNotices(organizerId: Long, showId: Long): List<NoticeResponse> {
		ownedOrganizer(organizerId, showId)
		return noticeRepository.findVisibleByShowId(showId).map(NoticeResponse::from)
	}

	fun create(organizerId: Long, showId: Long, request: NoticeRequest): NoticeResponse {
		val organizer = ownedOrganizer(organizerId, showId)
		val (title, body) = validate(request)
		val notice = noticeRepository.save(Notice(organizer.show, organizer, request.kind, title, body, LocalDateTime.now(clock)))
		attachImages(notice, organizer, request.imageIds)
		return NoticeResponse.from(notice)
	}

	fun update(organizerId: Long, showId: Long, noticeId: Long, request: NoticeRequest): NoticeResponse {
		val organizer = ownedOrganizer(organizerId, showId)
		val notice = ownedNotice(showId, noticeId)
		val (title, body) = validate(request)
		notice.kind = request.kind
		notice.title = title
		notice.body = body
		notice.updatedAt = LocalDateTime.now(clock)
		attachImages(notice, organizer, request.imageIds)
		return NoticeResponse.from(notice)
	}

	fun delete(organizerId: Long, showId: Long, noticeId: Long) {
		ownedOrganizer(organizerId, showId)
		ownedNotice(showId, noticeId).deletedAt = LocalDateTime.now(clock)
	}

	fun uploadImage(organizerId: Long, showId: Long, bytes: ByteArray, contentType: String?): NoticeImageResponse {
		val organizer = ownedOrganizer(organizerId, showId)
		val image = UploadedImage.read(bytes, contentType)
		val key = "notices/$showId/${UUID.randomUUID()}.${image.extension}"
		val url = storage.put(key, image.bytes, image.contentType)
		val saved = noticeImageRepository.save(
			NoticeImage(organizer.show, organizer, key, url, image.width, image.height, LocalDateTime.now(clock)),
		)
		return NoticeImageResponse.from(saved)
	}

	fun deleteUnattachedImages() {
		val before = LocalDateTime.now(clock).minus(UNATTACHED_TTL)
		noticeImageRepository.findUnattachedBefore(before).forEach {
			storage.delete(it.storageKey)
			noticeImageRepository.delete(it)
		}
	}

	private fun attachImages(notice: Notice, organizer: Organizer, imageIds: List<Long>) {
		val ids = imageIds.distinct()
		if (ids.size > MAX_IMAGES) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지는 ${MAX_IMAGES}장까지 붙일 수 있어요.")
		val images = noticeImageRepository.findAllById(ids).associateBy { it.id }
		val picked = ids.map { id ->
			images[id]?.takeIf { it.organizer.id == organizer.id && (it.notice == null || it.notice?.id == notice.id) }
				?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "붙일 수 없는 이미지가 있어요.")
		}
		notice.images.filter { it !in picked }.forEach {
			storage.delete(it.storageKey)
			noticeImageRepository.delete(it)
		}
		notice.images.clear()
		picked.forEachIndexed { index, image ->
			image.notice = notice
			image.position = index
			notice.images += image
		}
	}

	private fun validate(request: NoticeRequest): Pair<String, String?> {
		val title = request.title.trim()
		val body = request.body?.trim()?.ifBlank { null }
		if (title.isEmpty() || title.length > MAX_TITLE) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 1~${MAX_TITLE}자로 적어 주세요.")
		}
		if (body != null && body.length > MAX_BODY) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "내용은 ${"%,d".format(MAX_BODY)}자까지 적을 수 있어요.")
		}
		if (body == null && request.imageIds.isEmpty()) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "내용을 적거나 이미지를 붙여 주세요.")
		}
		return title to body
	}

	private fun ownedOrganizer(organizerId: Long, showId: Long): Organizer {
		val organizer = organizerRepository.findById(organizerId).orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED) }
		if (organizer.show.id != showId) throw ResponseStatusException(HttpStatus.FORBIDDEN)
		return organizer
	}

	private fun ownedNotice(showId: Long, noticeId: Long): Notice =
		noticeRepository.findById(noticeId).orElse(null)?.takeIf { it.show.id == showId && it.deletedAt == null }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	companion object {
		private const val MAX_TITLE = 60
		private const val MAX_BODY = 3000
		private const val MAX_IMAGES = 4
		private const val MAX_PARTICIPATED = 50
		private val UNATTACHED_TTL = Duration.ofDays(1)
	}
}
