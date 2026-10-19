package com.ycc.admin

import com.ycc.show.ReviewStatus
import com.ycc.show.ShowKind
import com.ycc.user.User
import com.ycc.user.UserService
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/admin/shows")
class AdminShowController(
	private val adminShowService: AdminShowService,
	private val userService: UserService,
) {

	private fun OAuth2User.user(): User = userService.get(name.toLong())

	@GetMapping
	fun shows(
		@AuthenticationPrincipal principal: OAuth2User,
		@RequestParam(defaultValue = "PENDING") status: ReviewStatus,
		@RequestParam(defaultValue = "FESTIVAL") kind: ShowKind,
	) = adminShowService.shows(principal.user(), status, kind)

	@PutMapping("/review")
	fun review(@AuthenticationPrincipal principal: OAuth2User, @RequestBody request: ReviewRequest) =
		adminShowService.review(principal.user(), request)
}
