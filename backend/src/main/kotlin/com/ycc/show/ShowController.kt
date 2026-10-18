package com.ycc.show

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/shows")
class ShowController(private val showRepository: ShowRepository) {

	@GetMapping
	fun search(@RequestParam(required = false) q: String?): List<ShowResponse> {
		val pattern = q?.lowercase()?.replace(Regex("[%_]"), "")?.trim()?.ifBlank { null }?.let { "%$it%" }
		return showRepository.searchVisible(pattern).map(ShowResponse::from)
	}

	@GetMapping("/{id}")
	fun detail(@PathVariable id: Long): ShowResponse =
		showRepository.findWithFacilityById(id)?.let(ShowResponse::from)
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
}
