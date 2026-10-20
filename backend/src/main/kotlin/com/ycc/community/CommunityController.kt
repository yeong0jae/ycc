package com.ycc.community

import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api/shows/{showId}/community")
class CommunityController(private val communityService: CommunityService) {

	@GetMapping
	fun posts(
		@PathVariable showId: Long,
		@RequestParam(required = false) kind: PostKind?,
		@RequestParam(required = false) before: Long?,
		@AuthenticationPrincipal principal: OAuth2User?,
	) = communityService.posts(showId, kind, before, principal?.name?.toLong())

	@GetMapping("/{postId}")
	fun post(@PathVariable showId: Long, @PathVariable postId: Long, @AuthenticationPrincipal principal: OAuth2User?) =
		communityService.post(showId, postId, principal?.name?.toLong())

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	fun create(@PathVariable showId: Long, @AuthenticationPrincipal principal: OAuth2User?, @RequestBody request: PostRequest) =
		communityService.create(member(principal), showId, request)

	@PutMapping("/{postId}")
	fun update(
		@PathVariable showId: Long,
		@PathVariable postId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: PostRequest,
	) = communityService.update(member(principal), showId, postId, request)

	@DeleteMapping("/{postId}")
	fun delete(@PathVariable showId: Long, @PathVariable postId: Long, @AuthenticationPrincipal principal: OAuth2User?) =
		communityService.delete(member(principal), showId, postId)

	@PostMapping("/images")
	@ResponseStatus(HttpStatus.CREATED)
	fun uploadImage(@PathVariable showId: Long, @AuthenticationPrincipal principal: OAuth2User?, @RequestPart file: MultipartFile) =
		communityService.uploadImage(member(principal), showId, file.bytes, file.contentType)

	@PostMapping("/{postId}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	fun comment(
		@PathVariable showId: Long,
		@PathVariable postId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: CommentRequest,
	) = communityService.comment(member(principal), showId, postId, request)

	@PutMapping("/{postId}/comments/{commentId}")
	fun updateComment(
		@PathVariable showId: Long,
		@PathVariable postId: Long,
		@PathVariable commentId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: CommentRequest,
	) = communityService.updateComment(member(principal), showId, postId, commentId, request)

	@DeleteMapping("/{postId}/comments/{commentId}")
	fun deleteComment(
		@PathVariable showId: Long,
		@PathVariable postId: Long,
		@PathVariable commentId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
	) = communityService.deleteComment(member(principal), showId, postId, commentId)

	@PutMapping("/{postId}/like")
	fun like(
		@PathVariable showId: Long,
		@PathVariable postId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: LikeRequest,
	) = communityService.like(member(principal), showId, postId, request)

	@PostMapping("/{postId}/report")
	fun reportPost(
		@PathVariable showId: Long,
		@PathVariable postId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: ReportRequest,
	) = communityService.reportPost(member(principal), showId, postId, request)

	@PostMapping("/{postId}/comments/{commentId}/report")
	fun reportComment(
		@PathVariable showId: Long,
		@PathVariable postId: Long,
		@PathVariable commentId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: ReportRequest,
	) = communityService.reportComment(member(principal), showId, postId, commentId, request)

	private fun member(principal: OAuth2User?) = principal?.name?.toLong() ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
}
