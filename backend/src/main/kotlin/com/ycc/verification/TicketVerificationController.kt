package com.ycc.verification

import com.ycc.dev.DevAuthController
import org.springframework.http.CacheControl
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.SessionAttribute
import org.springframework.web.multipart.MultipartFile

@RestController
class TicketVerificationController(private val verificationService: TicketVerificationService) {

	@GetMapping("/api/me/verifications")
	fun mine(@AuthenticationPrincipal principal: OAuth2User) = verificationService.mine(principal.name.toLong())

	@PostMapping("/api/me/verifications/{showId}")
	@ResponseStatus(HttpStatus.CREATED)
	fun submit(@AuthenticationPrincipal principal: OAuth2User, @PathVariable showId: Long, @RequestPart file: MultipartFile) =
		verificationService.submit(principal.name.toLong(), showId, file.bytes, file.contentType)

	@GetMapping("/api/dev/verifications")
	fun forReview(@RequestParam(required = false) status: VerificationStatus?) = verificationService.forReview(status)

	@GetMapping("/api/dev/verifications/{id}/image")
	fun image(@PathVariable id: Long): ResponseEntity<ByteArray> =
		ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).cacheControl(CacheControl.noStore()).body(verificationService.image(id))

	@PutMapping("/api/dev/verifications/{id}")
	fun decide(@SessionAttribute(DevAuthController.DEVELOPER_ID) developerId: Long, @PathVariable id: Long, @RequestBody request: DecisionRequest) =
		verificationService.decide(developerId, id, request)
}
