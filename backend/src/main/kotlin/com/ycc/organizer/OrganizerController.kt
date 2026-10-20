package com.ycc.organizer

import com.ycc.show.ShowResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpSession
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.SessionAttribute
import org.springframework.web.server.ResponseStatusException
import java.time.Duration

data class OrganizerLoginRequest(val username: String, val password: String)

data class OrganizerMeResponse(val username: String, val displayName: String, val showId: Long)

@RestController
@RequestMapping("/api/organizer")
class OrganizerController(
	private val organizerAuthService: OrganizerAuthService,
	private val organizerRepository: OrganizerRepository,
) {

	@PostMapping("/login")
	fun login(@RequestBody request: OrganizerLoginRequest, httpRequest: HttpServletRequest) {
		when (val result = organizerAuthService.login(request.username, request.password)) {
			is LoginResult.Success -> {
				httpRequest.getSession(true)
				httpRequest.changeSessionId()
				httpRequest.session.setAttribute(ORGANIZER_ID, result.organizerId)
				httpRequest.session.maxInactiveInterval = SESSION_TTL.toSeconds().toInt()
			}
			LoginResult.Invalid -> throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디나 비밀번호가 맞지 않아요.")
			LoginResult.Locked -> throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "비밀번호를 여러 번 틀려서 10분 동안 로그인할 수 없어요.")
			LoginResult.Inactive -> throw ResponseStatusException(HttpStatus.FORBIDDEN, "비활성화된 계정이에요. 개발자에게 문의해 주세요.")
		}
	}

	@PostMapping("/logout")
	fun logout(session: HttpSession) = session.removeAttribute(ORGANIZER_ID)

	@GetMapping("/me")
	@Transactional(readOnly = true)
	fun me(@SessionAttribute(ORGANIZER_ID) organizerId: Long): OrganizerMeResponse {
		val organizer = organizerRepository.findById(organizerId).orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED) }
		return OrganizerMeResponse(organizer.username, organizer.displayName, organizer.show.id)
	}

	@GetMapping("/shows/{id}")
	@Transactional(readOnly = true)
	fun show(@SessionAttribute(ORGANIZER_ID) organizerId: Long, @PathVariable id: Long): ShowResponse {
		val organizer = organizerRepository.findById(organizerId).orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED) }
		if (organizer.show.id != id) throw ResponseStatusException(HttpStatus.FORBIDDEN)
		return ShowResponse.from(organizer.show)
	}

	companion object {
		const val ORGANIZER_ID = "organizerId"
		private val SESSION_TTL = Duration.ofDays(14)
	}
}
