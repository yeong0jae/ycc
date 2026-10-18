package com.ycc.user

import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class MeResponse(val id: Long, val nickname: String?, val gender: Gender?, val onboarded: Boolean) {
	companion object {
		fun from(user: User) = MeResponse(user.id, user.nickname, user.gender, user.onboarded)
	}
}

data class UpdateMeRequest(val nickname: String, val gender: Gender)

@RestController
@RequestMapping("/api/me")
class MeController(private val userService: UserService) {

	@GetMapping
	fun me(@AuthenticationPrincipal principal: OAuth2User): MeResponse =
		MeResponse.from(userService.get(principal.name.toLong()))

	@PutMapping
	fun update(@AuthenticationPrincipal principal: OAuth2User, @RequestBody request: UpdateMeRequest): MeResponse =
		MeResponse.from(userService.updateProfile(principal.name.toLong(), request.nickname, request.gender))
}
