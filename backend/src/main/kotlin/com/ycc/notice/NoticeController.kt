package com.ycc.notice

import com.ycc.organizer.OrganizerController
import org.springframework.http.CacheControl
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.MediaTypeFactory
import org.springframework.core.io.FileSystemResource
import org.springframework.web.bind.annotation.DeleteMapping
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
import java.nio.file.Files
import java.time.Duration

@RestController
class NoticeController(
	private val noticeService: NoticeService,
	private val storage: NoticeImageStorage,
) {

	@GetMapping("/api/shows/{showId}/notices")
	fun showNotices(@PathVariable showId: Long) = noticeService.showNotices(showId)

	@GetMapping("/api/shows/participated")
	fun participated(@RequestParam ids: List<Long>) = noticeService.participated(ids)

	@GetMapping("/api/organizer/shows/{showId}/notices")
	fun organizerNotices(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long) =
		noticeService.organizerNotices(organizerId, showId)

	@PostMapping("/api/organizer/shows/{showId}/notices")
	@ResponseStatus(HttpStatus.CREATED)
	fun create(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@RequestBody request: NoticeRequest,
	) = noticeService.create(organizerId, showId, request)

	@PutMapping("/api/organizer/shows/{showId}/notices/{noticeId}")
	fun update(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@PathVariable noticeId: Long,
		@RequestBody request: NoticeRequest,
	) = noticeService.update(organizerId, showId, noticeId, request)

	@DeleteMapping("/api/organizer/shows/{showId}/notices/{noticeId}")
	fun delete(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@PathVariable noticeId: Long,
	) = noticeService.delete(organizerId, showId, noticeId)

	@PostMapping("/api/organizer/shows/{showId}/notice-images")
	@ResponseStatus(HttpStatus.CREATED)
	fun uploadImage(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@RequestPart file: MultipartFile,
	) = noticeService.uploadImage(organizerId, showId, file.bytes, file.contentType)

	@GetMapping("/api/notice-images/files/{*key}")
	fun file(@PathVariable key: String): ResponseEntity<FileSystemResource> {
		val local = storage as? LocalNoticeImageStorage ?: return ResponseEntity.notFound().build()
		val path = runCatching { local.resolve(key.removePrefix("/")) }.getOrNull()
		if (path == null || !Files.isRegularFile(path)) return ResponseEntity.notFound().build()
		return ResponseEntity.ok()
			.contentType(MediaTypeFactory.getMediaType(path.fileName.toString()).orElse(MediaType.APPLICATION_OCTET_STREAM))
			.cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
			.body(FileSystemResource(path))
	}
}
