package com.ycc.community

import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class CommunityFeedController(private val communityService: CommunityService) {

	@GetMapping("/api/community")
	fun feed(
		@RequestParam(required = false) showIds: List<Long>?,
		@RequestParam(required = false) kind: PostKind?,
		@RequestParam(required = false) before: Long?,
		@AuthenticationPrincipal principal: OAuth2User?,
	) = communityService.feed(showIds, kind, before, principal?.name?.toLong())
}
