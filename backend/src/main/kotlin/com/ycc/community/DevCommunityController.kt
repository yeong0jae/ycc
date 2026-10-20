package com.ycc.community

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDateTime

data class ReportedResponse(
	val type: ReportTarget,
	val id: Long,
	val showId: Long,
	val showName: String,
	val postId: Long,
	val body: String,
	val author: String,
	val createdAt: LocalDateTime,
	val hidden: Boolean,
	val reasons: Map<ReportReason, Int>,
	val lastReportedAt: LocalDateTime,
)

data class HideRequest(val hidden: Boolean)

@Service
@Transactional
class DevCommunityService(
	private val reportRepository: CommunityReportRepository,
	private val postRepository: CommunityPostRepository,
	private val commentRepository: CommunityCommentRepository,
	private val clock: Clock,
) {

	@Transactional(readOnly = true)
	fun reports(): List<ReportedResponse> =
		reportRepository.findByResolvedAtIsNullOrderByIdDesc().groupBy { it.targetType to it.targetId }.mapNotNull { (target, reports) ->
			val reasons = reports.groupingBy { it.reason }.eachCount()
			val last = reports.maxOf { it.createdAt }
			when (target.first) {
				ReportTarget.POST -> postRepository.findById(target.second).orElse(null)?.takeIf { it.deletedAt == null }?.let {
					ReportedResponse(ReportTarget.POST, it.id, it.show.id, it.show.name, it.id, it.body, it.user.nickname.orEmpty(), it.createdAt, it.hiddenAt != null, reasons, last)
				}
				ReportTarget.COMMENT -> commentRepository.findById(target.second).orElse(null)?.takeIf { it.deletedAt == null }?.let {
					ReportedResponse(ReportTarget.COMMENT, it.id, it.post.show.id, it.post.show.name, it.post.id, it.body, it.user.nickname.orEmpty(), it.createdAt, it.hiddenAt != null, reasons, last)
				}
			}
		}

	fun hide(type: ReportTarget, id: Long, request: HideRequest) {
		val now = LocalDateTime.now(clock)
		val hiddenAt = if (request.hidden) now else null
		when (type) {
			ReportTarget.POST -> postRepository.findById(id).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }.hiddenAt = hiddenAt
			ReportTarget.COMMENT -> commentRepository.findById(id).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }.hiddenAt = hiddenAt
		}
		reportRepository.findByTargetTypeAndTargetIdAndResolvedAtIsNull(type, id).forEach { it.resolvedAt = now }
	}
}

@RestController
@RequestMapping("/api/dev/community")
class DevCommunityController(private val devCommunityService: DevCommunityService) {

	@GetMapping("/reports")
	fun reports() = devCommunityService.reports()

	@PutMapping("/{type}/{id}/hidden")
	fun hide(@PathVariable type: ReportTarget, @PathVariable id: Long, @RequestBody request: HideRequest) = devCommunityService.hide(type, id, request)
}
