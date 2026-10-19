package com.ycc.admin

import com.ycc.show.ReviewStatus
import com.ycc.show.ShowKind
import com.ycc.show.ShowRepository
import com.ycc.show.ShowResponse
import com.ycc.user.User
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

data class ReviewShowResponse(
	val show: ShowResponse,
	val kopisId: String,
	val area: String?,
	val cast: String?,
	val reviewStatus: ReviewStatus,
)

data class ReviewListResponse(val items: List<ReviewShowResponse>, val counts: Map<ReviewStatus, Long>)

data class ReviewRequest(val ids: List<Long>, val status: ReviewStatus)

@Service
@Transactional
class AdminShowService(private val showRepository: ShowRepository) {

	@Transactional(readOnly = true)
	fun shows(admin: User, status: ReviewStatus, kind: ShowKind): ReviewListResponse {
		requireAdmin(admin)
		return ReviewListResponse(
			items = showRepository.findByReviewStatusAndKindOrderByStartDateAscIdAsc(status, kind).map {
				ReviewShowResponse(ShowResponse.from(it), it.kopisId, it.area, it.castText, it.reviewStatus)
			},
			counts = ReviewStatus.entries.associateWith { showRepository.countByReviewStatusAndKind(it, kind) },
		)
	}

	fun review(admin: User, request: ReviewRequest) {
		requireAdmin(admin)
		showRepository.findAllById(request.ids).forEach { it.reviewStatus = request.status }
	}

	private fun requireAdmin(user: User) {
		if (!user.admin) throw ResponseStatusException(HttpStatus.FORBIDDEN)
	}
}
