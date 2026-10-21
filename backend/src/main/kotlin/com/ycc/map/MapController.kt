package com.ycc.map

import com.ycc.organizer.OrganizerController
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.SessionAttribute
import org.springframework.web.multipart.MultipartFile

@RestController
class MapController(private val mapService: MapService) {

	@GetMapping("/api/shows/{showId}/map")
	fun showMap(@PathVariable showId: Long) = mapService.showMap(showId)

	@GetMapping("/api/organizer/shows/{showId}/map")
	fun organizerMap(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long) =
		mapService.organizerMap(organizerId, showId)

	@PostMapping("/api/organizer/shows/{showId}/map/images")
	fun uploadImage(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @RequestPart file: MultipartFile) =
		mapService.uploadImage(organizerId, showId, file.bytes, file.contentType)

	@DeleteMapping("/api/organizer/shows/{showId}/map/images/{imageId}")
	fun deleteImage(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @PathVariable imageId: Long) =
		mapService.deleteImage(organizerId, showId, imageId)

	@PutMapping("/api/organizer/shows/{showId}/map/images/{imageId}/crop")
	fun cropImage(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@PathVariable imageId: Long,
		@RequestBody request: CropRequest,
	) = mapService.cropImage(organizerId, showId, imageId, request)

	@PostMapping("/api/organizer/shows/{showId}/map/ai")
	fun findPins(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long) =
		mapService.findPins(organizerId, showId)

	@PostMapping("/api/organizer/shows/{showId}/map/pins")
	fun addPin(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @RequestBody request: PinRequest) =
		mapService.addPin(organizerId, showId, request)

	@PutMapping("/api/organizer/shows/{showId}/map/pins/{pinId}")
	fun updatePin(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@PathVariable pinId: Long,
		@RequestBody request: PinRequest,
	) = mapService.updatePin(organizerId, showId, pinId, request)

	@DeleteMapping("/api/organizer/shows/{showId}/map/pins/{pinId}")
	fun deletePin(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @PathVariable pinId: Long) =
		mapService.deletePin(organizerId, showId, pinId)

	@PutMapping("/api/organizer/shows/{showId}/map/published")
	fun publish(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @RequestBody request: MapPublishRequest) =
		mapService.publish(organizerId, showId, request)
}
