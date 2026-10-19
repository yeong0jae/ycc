package com.ycc.dev

import com.ycc.show.ReviewStatus
import com.ycc.show.ShowKind
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/dev/shows")
class DevShowController(private val devShowService: DevShowService) {

	@GetMapping
	fun shows(
		@RequestParam(defaultValue = "PENDING") status: ReviewStatus,
		@RequestParam(defaultValue = "FESTIVAL") kind: ShowKind,
	) = devShowService.shows(status, kind)

	@PutMapping("/review")
	fun review(@RequestBody request: ReviewRequest) = devShowService.review(request)
}
