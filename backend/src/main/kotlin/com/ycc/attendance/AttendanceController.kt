package com.ycc.attendance

import com.ycc.user.User
import com.ycc.user.UserService
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
class AttendanceController(
	private val attendanceService: AttendanceService,
	private val userService: UserService,
) {

	private fun OAuth2User.user(): User = userService.get(name.toLong())

	@PutMapping("/api/shows/{showId}/attendances/{date}")
	fun set(
		@AuthenticationPrincipal principal: OAuth2User,
		@PathVariable showId: Long,
		@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
		@RequestBody request: SetAttendanceRequest,
	) = attendanceService.set(principal.user(), showId, date, request.status)

	@DeleteMapping("/api/shows/{showId}/attendances/{date}")
	fun delete(
		@AuthenticationPrincipal principal: OAuth2User,
		@PathVariable showId: Long,
		@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
	) = attendanceService.delete(principal.user(), showId, date)

	@GetMapping("/api/home")
	fun home(@AuthenticationPrincipal principal: OAuth2User) = attendanceService.home(principal.user())

	@GetMapping("/api/me/records")
	fun records(@AuthenticationPrincipal principal: OAuth2User) = attendanceService.records(principal.user())
}
