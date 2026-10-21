package com.ycc.suggestion

import com.ycc.organizer.OrganizerController
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.web.bind.annotation.CookieValue
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
import java.time.Duration
import java.util.UUID

@RestController
class SuggestionController(
	private val suggestionService: SuggestionService,
	@Value("\${app.frontend-url}") private val frontendUrl: String,
) {

	@PostMapping("/api/site/{code}")
	fun enter(
		@PathVariable code: String,
		@CookieValue(DEVICE_COOKIE, required = false) deviceId: String?,
		response: HttpServletResponse,
	): SiteEntryResponse {
		val device = deviceId?.takeIf(::isDeviceId) ?: UUID.randomUUID().toString()
		val entry = suggestionService.enter(code, device)
		val cookie = ResponseCookie.from(DEVICE_COOKIE, device)
			.path("/")
			.httpOnly(true)
			.secure(frontendUrl.startsWith("https://"))
			.sameSite("Lax")
			.maxAge(DEVICE_TTL)
			.build()
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString())
		return entry
	}

	@GetMapping("/api/shows/{showId}/suggestions")
	fun showSuggestions(
		@PathVariable showId: Long,
		@CookieValue(DEVICE_COOKIE, required = false) deviceId: String?,
		@AuthenticationPrincipal principal: OAuth2User?,
	) = suggestionService.showSuggestions(showId, deviceId?.takeIf(::isDeviceId), principal?.name?.toLong())

	@PostMapping("/api/shows/{showId}/suggestions")
	@ResponseStatus(HttpStatus.CREATED)
	fun create(
		@PathVariable showId: Long,
		@CookieValue(DEVICE_COOKIE, required = false) deviceId: String?,
		@AuthenticationPrincipal principal: OAuth2User?,
		@RequestParam body: String,
		@RequestPart(required = false) file: MultipartFile?,
	) = suggestionService.create(showId, deviceId?.takeIf(::isDeviceId), principal?.name?.toLong(), body, file?.bytes, file?.contentType)

	@GetMapping("/api/organizer/shows/{showId}/suggestions")
	fun organizerSuggestions(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long) =
		suggestionService.organizerSuggestions(organizerId, showId)

	@PutMapping("/api/organizer/shows/{showId}/suggestions/{suggestionId}/reply")
	fun reply(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@PathVariable suggestionId: Long,
		@RequestBody request: ReplyRequest,
	) = suggestionService.reply(organizerId, showId, suggestionId, request)

	@PutMapping("/api/organizer/shows/{showId}/suggestions/{suggestionId}/hidden")
	fun hide(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@PathVariable suggestionId: Long,
		@RequestBody request: HiddenRequest,
	) = suggestionService.hide(organizerId, showId, suggestionId, request)

	@GetMapping("/api/organizer/shows/{showId}/site-code")
	fun siteCode(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long) =
		suggestionService.siteCode(organizerId, showId)

	@PostMapping("/api/organizer/shows/{showId}/site-code")
	fun regenerateSiteCode(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long) =
		suggestionService.regenerateSiteCode(organizerId, showId)

	private fun isDeviceId(value: String) = runCatching { UUID.fromString(value) }.isSuccess && value.length == 36

	companion object {
		const val DEVICE_COOKIE = "ycc_device"
		private val DEVICE_TTL = Duration.ofDays(365)
	}
}
