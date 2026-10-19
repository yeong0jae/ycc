package com.ycc.show

import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDate

enum class ShowPeriod { PAST, UPCOMING }

data class ShowPageResponse(val items: List<ShowResponse>, val hasNext: Boolean, val total: Long)

@RestController
@RequestMapping("/api/shows")
class ShowController(
	private val showRepository: ShowRepository,
	private val clock: Clock,
) {

	@GetMapping
	fun search(
		@RequestParam(required = false) q: String?,
		@RequestParam(defaultValue = "FESTIVAL") kind: ShowKind,
		@RequestParam(defaultValue = "UPCOMING") period: ShowPeriod,
		@RequestParam(defaultValue = "0") page: Int,
		@RequestParam(defaultValue = "24") size: Int,
	): ShowPageResponse {
		val pattern = q?.lowercase()?.replace(Regex("[%_\\s]"), "")?.ifBlank { null }?.let { "%$it%" }
		val today = LocalDate.now(clock)
		val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, MAX_SIZE))
		val result = when (period) {
			ShowPeriod.UPCOMING -> showRepository.searchUpcoming(kind, pattern, today, pageable)
			ShowPeriod.PAST -> showRepository.searchPast(kind, pattern, today, pageable)
		}
		return ShowPageResponse(result.content.map(ShowResponse::from), result.hasNext(), result.totalElements)
	}

	@GetMapping("/{id}")
	fun detail(@PathVariable id: Long): ShowResponse =
		showRepository.findWithFacilityById(id)?.let(ShowResponse::from)
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	companion object {
		private const val MAX_SIZE = 100
	}
}
