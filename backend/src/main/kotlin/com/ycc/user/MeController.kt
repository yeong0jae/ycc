package com.ycc.user

import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

data class MeResponse(val id: Long, val nickname: String, val avatarUrl: String?) {
	companion object {
		fun from(user: User) = MeResponse(user.id, user.nickname.orEmpty(), user.avatarUrl)
	}
}

data class UpdateMeRequest(val nickname: String)

data class NicknameResponse(val nickname: String)

data class ParticipationsRequest(val showIds: List<Long>)

data class ParticipationsResponse(val userId: Long, val showIds: List<Long>)

@RestController
@RequestMapping("/api/me")
class MeController(private val userService: UserService) {

	@GetMapping
	fun me(@AuthenticationPrincipal principal: OAuth2User): MeResponse =
		MeResponse.from(userService.findOrCreate(principal.name.toLong()))

	@PutMapping
	fun update(@AuthenticationPrincipal principal: OAuth2User, @RequestBody request: UpdateMeRequest): MeResponse =
		MeResponse.from(userService.updateNickname(principal.name.toLong(), request.nickname))

	@PutMapping("/avatar")
	fun updateAvatar(@AuthenticationPrincipal principal: OAuth2User, @RequestPart file: MultipartFile): MeResponse =
		MeResponse.from(userService.updateAvatar(principal.name.toLong(), file.bytes, file.contentType))

	@DeleteMapping("/avatar")
	fun deleteAvatar(@AuthenticationPrincipal principal: OAuth2User): MeResponse =
		MeResponse.from(userService.deleteAvatar(principal.name.toLong()))

	@GetMapping("/random-nickname")
	fun randomNickname() = NicknameResponse(userService.randomNickname())

	@GetMapping("/participations")
	fun participations(@AuthenticationPrincipal principal: OAuth2User) = response(principal, userService.participations(principal.name.toLong()))

	@PostMapping("/participations")
	fun participate(@AuthenticationPrincipal principal: OAuth2User, @RequestBody request: ParticipationsRequest) =
		response(principal, userService.participate(principal.name.toLong(), request.showIds))

	@DeleteMapping("/participations/{showId}")
	fun leave(@AuthenticationPrincipal principal: OAuth2User, @PathVariable showId: Long) =
		response(principal, userService.leave(principal.name.toLong(), showId))

	@DeleteMapping
	fun withdraw(@AuthenticationPrincipal principal: OAuth2User, request: HttpServletRequest) {
		userService.withdraw(principal.name.toLong())
		SecurityContextHolder.clearContext()
		request.getSession(false)?.invalidate()
	}

	private fun response(principal: OAuth2User, showIds: List<Long>) =
		ParticipationsResponse(userService.get(principal.name.toLong()).id, showIds)
}
