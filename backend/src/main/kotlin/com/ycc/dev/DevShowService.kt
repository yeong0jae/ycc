package com.ycc.dev

import com.ycc.show.ReviewStatus
import com.ycc.show.ShowKind
import com.ycc.show.ShowRepository
import com.ycc.show.ShowResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

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
class DevShowService(private val showRepository: ShowRepository) {

	@Transactional(readOnly = true)
	fun shows(status: ReviewStatus, kind: ShowKind): ReviewListResponse {
		return ReviewListResponse(
			items = showRepository.findByReviewStatusAndKindOrderByStartDateAscIdAsc(status, kind).map {
				ReviewShowResponse(ShowResponse.from(it), it.kopisId, it.area, it.castText, it.reviewStatus)
			},
			counts = ReviewStatus.entries.associateWith { showRepository.countByReviewStatusAndKind(it, kind) },
		)
	}

	fun review(request: ReviewRequest) {
		showRepository.findAllById(request.ids).forEach { it.reviewStatus = request.status }
	}
}
