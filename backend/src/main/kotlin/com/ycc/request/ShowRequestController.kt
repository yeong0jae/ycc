package com.ycc.request

import com.ycc.user.UserService
import jakarta.servlet.http.HttpSession
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.Duration
import java.time.Instant

@RestController
class ShowRequestController(
	private val showRequestService: ShowRequestService,
	private val userService: UserService,
	private val clock: Clock,
) {

	@PostMapping("/api/show-requests")
	@ResponseStatus(HttpStatus.CREATED)
	fun create(
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: CreateShowRequest,
		session: HttpSession,
	) {
		val now = Instant.now(clock)
		@Suppress("UNCHECKED_CAST")
		val recent = (session.getAttribute(RECENT_REQUESTS) as List<Instant>? ?: emptyList())
			.filter { Duration.between(it, now) < WINDOW }
		if (recent.size >= MAX_PER_WINDOW) {
			throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 보내 주세요.")
		}
		showRequestService.create(request, principal?.let { userService.get(it.name.toLong()) })
		session.setAttribute(RECENT_REQUESTS, ArrayList(recent + now))
	}

	@GetMapping("/api/dev/show-requests")
	fun list(@RequestParam(defaultValue = "PENDING") status: ShowRequestStatus) = showRequestService.list(status)

	@PutMapping("/api/dev/show-requests/{id}")
	fun update(@PathVariable id: Long, @RequestBody request: UpdateShowRequest) =
		showRequestService.update(id, request.status)

	companion object {
		private const val RECENT_REQUESTS = "recentShowRequests"
		private const val MAX_PER_WINDOW = 3
		private val WINDOW = Duration.ofMinutes(1)
	}
}
