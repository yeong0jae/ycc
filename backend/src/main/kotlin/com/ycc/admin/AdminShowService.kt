package com.ycc.admin

import com.ycc.show.ReviewStatus
import com.ycc.show.ShowRepository
import com.ycc.show.ShowResponse
import com.ycc.user.User
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

data class ReviewShowResponse(val show: ShowResponse, val reviewStatus: ReviewStatus)

data class ReviewPageResponse(val items: List<ReviewShowResponse>, val hasNext: Boolean, val counts: Map<ReviewStatus, Long>)

data class ReviewRequest(val ids: List<Long>, val status: ReviewStatus)

@Service
@Transactional
class AdminShowService(private val showRepository: ShowRepository) {

	@Transactional(readOnly = true)
	fun shows(admin: User, status: ReviewStatus, page: Int): ReviewPageResponse {
		requireAdmin(admin)
		val slice = showRepository.findByReviewStatus(status, PageRequest.of(page.coerceAtLeast(0), PAGE_SIZE))
		return ReviewPageResponse(
			items = slice.content.map { ReviewShowResponse(ShowResponse.from(it), it.reviewStatus) },
			hasNext = slice.hasNext(),
			counts = ReviewStatus.entries.associateWith(showRepository::countByReviewStatus),
		)
	}

	fun review(admin: User, request: ReviewRequest) {
		requireAdmin(admin)
		showRepository.findAllById(request.ids).forEach { it.reviewStatus = request.status }
	}

	private fun requireAdmin(user: User) {
		if (!user.admin) throw ResponseStatusException(HttpStatus.FORBIDDEN)
	}

	companion object {
		private const val PAGE_SIZE = 50
	}
}
