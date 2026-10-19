package com.ycc.organizer

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/dev/organizers")
class DevOrganizerController(private val devOrganizerService: DevOrganizerService) {

	@GetMapping
	fun list() = devOrganizerService.list()

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun create(@RequestBody request: CreateOrganizerRequest) = devOrganizerService.create(request)

	@PutMapping("/{id}/password")
	fun changePassword(@PathVariable id: Long, @RequestBody request: PasswordRequest) =
		devOrganizerService.changePassword(id, request.password)

	@PutMapping("/{id}/show")
	fun changeShow(@PathVariable id: Long, @RequestBody request: ShowChangeRequest) =
		devOrganizerService.changeShow(id, request.showId)

	@PutMapping("/{id}/active")
	fun changeActive(@PathVariable id: Long, @RequestBody request: ActiveRequest) =
		devOrganizerService.changeActive(id, request.active)

	@GetMapping("/shows")
	fun assignableShows(@RequestParam(required = false) q: String?) = devOrganizerService.assignableShows(q)
}
