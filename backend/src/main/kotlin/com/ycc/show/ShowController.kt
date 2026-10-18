package com.ycc.show

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDate

@RestController
@RequestMapping("/api/shows")
class ShowController(
	private val showRepository: ShowRepository,
	private val clock: Clock,
) {

	@GetMapping
	fun list(): List<ShowResponse> =
		showRepository.findEndingOnOrAfter(LocalDate.now(clock).minusMonths(PAST_MONTHS))
			.map(ShowResponse::from)

	@GetMapping("/{id}")
	fun detail(@PathVariable id: Long): ShowResponse =
		showRepository.findWithFacilityById(id)?.let(ShowResponse::from)
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	companion object {
		private const val PAST_MONTHS = 3L
	}
}
