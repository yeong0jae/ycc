package com.ycc.festival

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDate

@RestController
@RequestMapping("/api/festivals")
class FestivalController(
	private val festivalRepository: FestivalRepository,
	private val clock: Clock,
) {

	@GetMapping
	fun list(): List<FestivalResponse> =
		festivalRepository.findByEndDateGreaterThanEqualOrderByStartDateAsc(LocalDate.now(clock))
			.map(FestivalResponse::from)

	@GetMapping("/{id}")
	fun detail(@PathVariable id: Long): FestivalResponse =
		festivalRepository.findById(id)
			.map(FestivalResponse::from)
			.orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
}
