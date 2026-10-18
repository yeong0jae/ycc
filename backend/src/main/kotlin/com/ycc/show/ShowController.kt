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

enum class ShowWhen { ONGOING, UPCOMING, PAST }

data class ShowPageResponse(val items: List<ShowResponse>, val hasNext: Boolean)

@RestController
@RequestMapping("/api/shows")
class ShowController(
	private val showRepository: ShowRepository,
	private val clock: Clock,
) {

	@GetMapping
	fun search(
		@RequestParam(required = false) q: String?,
		@RequestParam(defaultValue = "UPCOMING") `when`: ShowWhen,
		@RequestParam(defaultValue = "0") page: Int,
	): ShowPageResponse {
		val pattern = q?.lowercase()?.replace(Regex("[%_]"), "")?.trim()?.ifBlank { null }?.let { "%$it%" }
		val pageable = PageRequest.of(page.coerceAtLeast(0), PAGE_SIZE)
		val today = LocalDate.now(clock)
		val slice = when (`when`) {
			ShowWhen.ONGOING -> showRepository.searchOngoing(today, pattern, pageable)
			ShowWhen.UPCOMING -> showRepository.searchUpcoming(today, pattern, pageable)
			ShowWhen.PAST -> showRepository.searchPast(today, pattern, pageable)
		}
		return ShowPageResponse(slice.content.map(ShowResponse::from), slice.hasNext())
	}

	@GetMapping("/{id}")
	fun detail(@PathVariable id: Long): ShowResponse =
		showRepository.findWithFacilityById(id)?.let(ShowResponse::from)
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	companion object {
		private const val PAGE_SIZE = 20
	}
}
