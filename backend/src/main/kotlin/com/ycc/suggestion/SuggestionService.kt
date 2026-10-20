package com.ycc.suggestion

import com.ycc.notice.NoticeImageStorage
import com.ycc.notice.UploadedImage
import com.ycc.organizer.Organizer
import com.ycc.organizer.OrganizerRepository
import com.ycc.show.ReviewStatus
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.security.SecureRandom
import java.time.Clock
import java.time.LocalDateTime
import java.time.LocalTime
import java.util.UUID

enum class WriteState { OPEN, NO_PASS, CLOSED }

data class SuggestionImageResponse(val url: String, val width: Int, val height: Int)

data class SuggestionReplyResponse(val body: String, val createdAt: LocalDateTime, val updatedAt: LocalDateTime?)

data class SuggestionResponse(
	val id: Long,
	val source: SuggestionSource,
	val body: String,
	val image: SuggestionImageResponse?,
	val createdAt: LocalDateTime,
	val reply: SuggestionReplyResponse?,
	val hidden: Boolean,
) {
	companion object {
		fun from(suggestion: Suggestion) = SuggestionResponse(
			suggestion.id,
			suggestion.source,
			suggestion.body,
			suggestion.imageUrl?.let { SuggestionImageResponse(it, suggestion.imageWidth ?: 0, suggestion.imageHeight ?: 0) },
			suggestion.createdAt,
			suggestion.reply?.let { SuggestionReplyResponse(it, suggestion.repliedAt!!, suggestion.replyUpdatedAt) },
			suggestion.hiddenAt != null,
		)
	}
}

data class ShowSuggestionsResponse(
	val items: List<SuggestionResponse>,
	val total: Int,
	val write: WriteState,
	val writableFrom: LocalDateTime,
	val writableUntil: LocalDateTime,
)

data class SiteEntryResponse(val showId: Long)

data class SiteCodeResponse(val code: String)

data class ReplyRequest(val body: String)

data class HiddenRequest(val hidden: Boolean)

@Service
@Transactional
class SuggestionService(
	private val suggestionRepository: SuggestionRepository,
	private val sitePassRepository: SitePassRepository,
	private val organizerRepository: OrganizerRepository,
	private val showRepository: ShowRepository,
	private val storage: NoticeImageStorage,
	private val clock: Clock,
) {

	private val random = SecureRandom()

	fun enter(code: String, deviceId: String): SiteEntryResponse {
		val show = showRepository.findBySiteCode(code)?.takeIf { it.reviewStatus == ReviewStatus.VISIBLE }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
		if (!sitePassRepository.existsByShowIdAndDeviceId(show.id, deviceId)) {
			sitePassRepository.save(SitePass(show, deviceId, LocalDateTime.now(clock)))
		}
		return SiteEntryResponse(show.id)
	}

	@Transactional(readOnly = true)
	fun showSuggestions(showId: Long, deviceId: String?): ShowSuggestionsResponse {
		val show = showRepository.findById(showId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		val items = suggestionRepository.findVisibleByShowId(showId).map(SuggestionResponse::from)
		val (from, until) = window(show)
		return ShowSuggestionsResponse(items, items.size, writeState(show, deviceId), from, until)
	}

	fun create(showId: Long, deviceId: String?, body: String, bytes: ByteArray?, contentType: String?): SuggestionResponse {
		val show = showRepository.findById(showId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		when (writeState(show, deviceId)) {
			WriteState.NO_PASS -> throw ResponseStatusException(HttpStatus.FORBIDDEN, "현장 QR을 찍으면 건의를 쓸 수 있어요.")
			WriteState.CLOSED -> throw ResponseStatusException(HttpStatus.FORBIDDEN, "건의는 공연 기간에만 쓸 수 있어요.")
			WriteState.OPEN -> {}
		}
		val device = deviceId!!
		val text = body.trim()
		if (text.isEmpty() || text.length > MAX_BODY) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "건의는 1~${MAX_BODY}자로 적어 주세요.")
		val now = LocalDateTime.now(clock)
		if (suggestionRepository.countByShowIdAndDeviceIdAndCreatedAtAfter(showId, device, now.minusMinutes(1)) > 0) {
			throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "잠시 뒤에 다시 써 주세요.")
		}
		if (suggestionRepository.countByShowIdAndDeviceIdAndCreatedAtAfter(showId, device, now.toLocalDate().atStartOfDay()) >= MAX_PER_DAY) {
			throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "오늘은 건의를 ${MAX_PER_DAY}개까지 쓸 수 있어요.")
		}
		val image = bytes?.takeIf { it.isNotEmpty() }?.let { UploadedImage.read(it, contentType) }
		val key = image?.let { "suggestions/$showId/${UUID.randomUUID()}.${it.extension}" }
		val url = image?.let { storage.put(key!!, it.bytes, it.contentType) }
		val saved = suggestionRepository.save(
			Suggestion(show, SuggestionSource.SITE_QR, device, text, now, key, url, image?.width, image?.height),
		)
		return SuggestionResponse.from(saved)
	}

	@Transactional(readOnly = true)
	fun organizerSuggestions(organizerId: Long, showId: Long): List<SuggestionResponse> {
		ownedOrganizer(organizerId, showId)
		return suggestionRepository.findByShowIdOrderByCreatedAtDescIdDesc(showId).map(SuggestionResponse::from)
	}

	fun reply(organizerId: Long, showId: Long, suggestionId: Long, request: ReplyRequest): SuggestionResponse {
		val organizer = ownedOrganizer(organizerId, showId)
		val suggestion = ownedSuggestion(showId, suggestionId)
		val text = request.body.trim()
		if (text.isEmpty() || text.length > MAX_REPLY) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "답변은 1~${"%,d".format(MAX_REPLY)}자로 적어 주세요.")
		val now = LocalDateTime.now(clock)
		if (suggestion.reply == null) suggestion.repliedAt = now else suggestion.replyUpdatedAt = now
		suggestion.reply = text
		suggestion.replyOrganizer = organizer
		return SuggestionResponse.from(suggestion)
	}

	fun hide(organizerId: Long, showId: Long, suggestionId: Long, request: HiddenRequest): SuggestionResponse {
		ownedOrganizer(organizerId, showId)
		val suggestion = ownedSuggestion(showId, suggestionId)
		suggestion.hiddenAt = if (request.hidden) suggestion.hiddenAt ?: LocalDateTime.now(clock) else null
		return SuggestionResponse.from(suggestion)
	}

	fun siteCode(organizerId: Long, showId: Long): SiteCodeResponse {
		val show = ownedOrganizer(organizerId, showId).show
		return SiteCodeResponse(show.siteCode ?: newCode(show))
	}

	fun regenerateSiteCode(organizerId: Long, showId: Long) = SiteCodeResponse(newCode(ownedOrganizer(organizerId, showId).show))

	private fun newCode(show: Show): String {
		val code = (1..CODE_LENGTH).map { CODE_CHARS[random.nextInt(CODE_CHARS.length)] }.joinToString("")
		show.siteCode = code
		return code
	}

	private fun window(show: Show) = show.startDate.atStartOfDay() to show.endDate.plusDays(1).atTime(CLOSES_AT)

	private fun writeState(show: Show, deviceId: String?): WriteState {
		if (deviceId == null || !sitePassRepository.existsByShowIdAndDeviceId(show.id, deviceId)) return WriteState.NO_PASS
		val (from, until) = window(show)
		val now = LocalDateTime.now(clock)
		return if (now >= from && now < until) WriteState.OPEN else WriteState.CLOSED
	}

	private fun ownedOrganizer(organizerId: Long, showId: Long): Organizer {
		val organizer = organizerRepository.findById(organizerId).orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED) }
		if (organizer.show.id != showId) throw ResponseStatusException(HttpStatus.FORBIDDEN)
		return organizer
	}

	private fun ownedSuggestion(showId: Long, suggestionId: Long) =
		suggestionRepository.findById(suggestionId).orElse(null)?.takeIf { it.show.id == showId }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	companion object {
		private const val MAX_BODY = 500
		private const val MAX_REPLY = 1000
		private const val MAX_PER_DAY = 10
		private const val CODE_LENGTH = 10
		private const val CODE_CHARS = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
		private val CLOSES_AT = LocalTime.NOON
	}
}
