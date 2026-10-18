package com.ycc.log

import com.ycc.user.User
import com.ycc.user.UserService
import org.springframework.core.io.FileSystemResource
import org.springframework.http.CacheControl
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
class LogController(
	private val logService: LogService,
	private val userService: UserService,
) {

	private fun OAuth2User.user(): User = userService.get(name.toLong())

	@GetMapping("/api/shows/{showId}/me")
	fun showMe(@AuthenticationPrincipal principal: OAuth2User, @PathVariable showId: Long) =
		logService.showMe(principal.user(), showId)

	@PutMapping("/api/shows/{showId}/plan")
	fun plan(@AuthenticationPrincipal principal: OAuth2User, @PathVariable showId: Long) =
		logService.plan(principal.user(), showId)

	@DeleteMapping("/api/shows/{showId}/plan")
	fun unplan(@AuthenticationPrincipal principal: OAuth2User, @PathVariable showId: Long) =
		logService.unplan(principal.user(), showId)

	@PostMapping("/api/shows/{showId}/log/clips", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
	fun uploadClip(
		@AuthenticationPrincipal principal: OAuth2User,
		@PathVariable showId: Long,
		@RequestParam moment: Moment,
		@RequestPart file: MultipartFile,
	) = logService.uploadClip(principal.user(), showId, moment, file)

	@DeleteMapping("/api/shows/{showId}/log/clips/{moment}")
	fun deleteClip(@AuthenticationPrincipal principal: OAuth2User, @PathVariable showId: Long, @PathVariable moment: Moment) =
		logService.deleteClip(principal.user(), showId, moment)

	@PostMapping("/api/shows/{showId}/log/publish")
	fun publish(@AuthenticationPrincipal principal: OAuth2User, @PathVariable showId: Long, @RequestBody request: PublishLogRequest) =
		logService.publish(principal.user(), showId, request)

	@GetMapping("/api/users/{userId}")
	fun profile(@PathVariable userId: Long) = logService.profile(userId)

	@GetMapping("/api/users/{userId}/logs")
	fun logs(@AuthenticationPrincipal principal: OAuth2User, @PathVariable userId: Long) =
		logService.logsOf(principal.user(), userId)

	@GetMapping("/api/logs/{logId}")
	fun log(@AuthenticationPrincipal principal: OAuth2User, @PathVariable logId: Long) = logService.log(principal.user(), logId)

	@DeleteMapping("/api/logs/{logId}")
	fun deleteLog(@AuthenticationPrincipal principal: OAuth2User, @PathVariable logId: Long) =
		logService.deleteLog(principal.user(), logId)

	@GetMapping("/api/logs/{logId}/video")
	fun video(@AuthenticationPrincipal principal: OAuth2User, @PathVariable logId: Long) =
		media(logService.mediaFile(principal.user(), logId, thumbnail = false), MediaType.parseMediaType("video/mp4"))

	@GetMapping("/api/logs/{logId}/thumbnail")
	fun thumbnail(@AuthenticationPrincipal principal: OAuth2User, @PathVariable logId: Long) =
		media(logService.mediaFile(principal.user(), logId, thumbnail = true), MediaType.IMAGE_JPEG)

	@GetMapping("/api/feed/past")
	fun pastFeed(@AuthenticationPrincipal principal: OAuth2User) = logService.pastFeed(principal.user())

	@GetMapping("/api/feed/next")
	fun nextFeed(@AuthenticationPrincipal principal: OAuth2User) = logService.nextFeed(principal.user())

	@PutMapping("/api/users/{userId}/signals/{kind}")
	fun signal(
		@AuthenticationPrincipal principal: OAuth2User,
		@PathVariable userId: Long,
		@PathVariable kind: SignalKind,
		@RequestParam showId: Long,
	) = logService.signal(principal.user(), userId, showId, kind)

	@DeleteMapping("/api/users/{userId}/signals/{kind}")
	fun cancelSignal(
		@AuthenticationPrincipal principal: OAuth2User,
		@PathVariable userId: Long,
		@PathVariable kind: SignalKind,
		@RequestParam showId: Long,
	) = logService.cancelSignal(principal.user(), userId, showId, kind)

	private fun media(path: java.nio.file.Path, type: MediaType) =
		ResponseEntity.ok().contentType(type).cacheControl(CacheControl.noCache()).body(FileSystemResource(path))
}
