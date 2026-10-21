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
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException

data class NewPostRequest(val showId: Long? = null, val kind: PostKind, val body: String, val imageIds: List<Long> = emptyList())

@RestController
@RequestMapping("/api/community")
class GeneralCommunityController(private val communityService: CommunityService) {

	@PostMapping("/posts")
	@ResponseStatus(HttpStatus.CREATED)
	fun create(@AuthenticationPrincipal principal: OAuth2User?, @RequestBody request: NewPostRequest) =
		communityService.create(member(principal), request.showId, PostRequest(request.kind, request.body, request.imageIds))

	@PostMapping("/images")
	@ResponseStatus(HttpStatus.CREATED)
	fun uploadImage(@AuthenticationPrincipal principal: OAuth2User?, @RequestPart file: MultipartFile) =
		communityService.uploadImage(member(principal), null, file.bytes, file.contentType)

	@GetMapping("/posts/{postId}")
	fun post(@PathVariable postId: Long, @AuthenticationPrincipal principal: OAuth2User?) = communityService.post(null, postId, principal?.name?.toLong())

	@PutMapping("/posts/{postId}")
	fun update(@PathVariable postId: Long, @AuthenticationPrincipal principal: OAuth2User?, @RequestBody request: PostRequest) =
		communityService.update(member(principal), null, postId, request)

	@DeleteMapping("/posts/{postId}")
	fun delete(@PathVariable postId: Long, @AuthenticationPrincipal principal: OAuth2User?) = communityService.delete(member(principal), null, postId)

	@PostMapping("/posts/{postId}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	fun comment(@PathVariable postId: Long, @AuthenticationPrincipal principal: OAuth2User?, @RequestBody request: CommentRequest) =
		communityService.comment(member(principal), null, postId, request)

	@PutMapping("/posts/{postId}/comments/{commentId}")
	fun updateComment(
		@PathVariable postId: Long,
		@PathVariable commentId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: CommentRequest,
	) = communityService.updateComment(member(principal), null, postId, commentId, request)

	@DeleteMapping("/posts/{postId}/comments/{commentId}")
	fun deleteComment(@PathVariable postId: Long, @PathVariable commentId: Long, @AuthenticationPrincipal principal: OAuth2User?) =
		communityService.deleteComment(member(principal), null, postId, commentId)

	@PutMapping("/posts/{postId}/like")
	fun like(@PathVariable postId: Long, @AuthenticationPrincipal principal: OAuth2User?, @RequestBody request: LikeRequest) =
		communityService.like(member(principal), null, postId, request)

	@PostMapping("/posts/{postId}/report")
	fun reportPost(@PathVariable postId: Long, @AuthenticationPrincipal principal: OAuth2User?, @RequestBody request: ReportRequest) =
		communityService.reportPost(member(principal), null, postId, request)

	@PostMapping("/posts/{postId}/comments/{commentId}/report")
	fun reportComment(
		@PathVariable postId: Long,
		@PathVariable commentId: Long,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestBody request: ReportRequest,
	) = communityService.reportComment(member(principal), null, postId, commentId, request)

	private fun member(principal: OAuth2User?) = principal?.name?.toLong() ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
}
