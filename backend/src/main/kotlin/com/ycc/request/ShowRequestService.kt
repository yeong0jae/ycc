package com.ycc.request

import com.ycc.show.ShowKind
import com.ycc.user.User
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDateTime

data class CreateShowRequest(val kind: ShowKind, val name: String, val url: String?)

data class ShowRequestResponse(
	val id: Long,
	val kind: ShowKind,
	val name: String,
	val url: String?,
	val nickname: String?,
	val member: Boolean,
	val status: ShowRequestStatus,
	val createdAt: LocalDateTime,
) {
	companion object {
		fun from(request: ShowRequest) = ShowRequestResponse(
			request.id,
			request.kind,
			request.name,
			request.url,
			request.user?.nickname,
			request.user != null,
			request.status,
			request.createdAt,
		)
	}
}

data class ShowRequestListResponse(val items: List<ShowRequestResponse>, val counts: Map<ShowRequestStatus, Long>)

data class UpdateShowRequest(val status: ShowRequestStatus)

@Service
@Transactional
class ShowRequestService(
	private val showRequestRepository: ShowRequestRepository,
	private val clock: Clock,
) {

	fun create(request: CreateShowRequest, user: User?) {
		val name = request.name.trim()
		val url = request.url?.trim()?.ifBlank { null }
		if (name.isEmpty() || name.length > MAX_NAME) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "공연 이름은 1~${MAX_NAME}자로 적어 주세요.")
		}
		if (url != null && (url.length > MAX_URL || !URL_PATTERN.matches(url))) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "링크는 http:// 또는 https://로 시작하는 주소로 적어 주세요.")
		}
		showRequestRepository.save(ShowRequest(request.kind, name, url, user, LocalDateTime.now(clock)))
	}

	@Transactional(readOnly = true)
	fun list(status: ShowRequestStatus) = ShowRequestListResponse(
		items = showRequestRepository.findByStatusWithUser(status).map(ShowRequestResponse::from),
		counts = ShowRequestStatus.entries.associateWith(showRequestRepository::countByStatus),
	)

	fun update(id: Long, status: ShowRequestStatus) {
		val request = showRequestRepository.findById(id).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		request.status = status
	}

	companion object {
		private const val MAX_NAME = 100
		private const val MAX_URL = 500
		private val URL_PATTERN = Regex("^https?://\\S+$")
	}
}
