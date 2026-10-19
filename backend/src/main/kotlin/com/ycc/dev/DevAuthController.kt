package com.ycc.dev

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpSession
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.SessionAttribute
import org.springframework.web.server.ResponseStatusException

data class DevLoginRequest(val username: String, val password: String)

data class DevMeResponse(val username: String)

@RestController
@RequestMapping("/api/dev")
class DevAuthController(
	private val developerRepository: DeveloperRepository,
	private val passwordEncoder: PasswordEncoder,
) {

	@PostMapping("/login")
	fun login(@RequestBody request: DevLoginRequest, httpRequest: HttpServletRequest): DevMeResponse {
		val developer = developerRepository.findByUsername(request.username)
			?.takeIf { passwordEncoder.matches(request.password, it.passwordHash) }
			?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디나 비밀번호가 맞지 않아요.")
		httpRequest.getSession(true)
		httpRequest.changeSessionId()
		httpRequest.session.setAttribute(DEVELOPER_ID, developer.id)
		return DevMeResponse(developer.username)
	}

	@GetMapping("/me")
	fun me(@SessionAttribute(DEVELOPER_ID) developerId: Long) =
		DevMeResponse(developerRepository.findById(developerId).orElseThrow { ResponseStatusException(HttpStatus.UNAUTHORIZED) }.username)

	@PostMapping("/logout")
	fun logout(session: HttpSession) = session.removeAttribute(DEVELOPER_ID)

	companion object {
		const val DEVELOPER_ID = "developerId"
	}
}
