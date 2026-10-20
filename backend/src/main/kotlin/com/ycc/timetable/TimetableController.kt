package com.ycc.timetable

import com.ycc.organizer.OrganizerController
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestPart
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.SessionAttribute
import org.springframework.web.multipart.MultipartFile
import java.time.LocalDate

@RestController
class TimetableController(private val timetableService: TimetableService) {

	@GetMapping("/api/shows/{showId}/timetable")
	fun showTimetable(@PathVariable showId: Long) = timetableService.showTimetable(showId)

	@GetMapping("/api/organizer/shows/{showId}/timetable")
	fun organizerTimetable(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long) =
		timetableService.organizerTimetable(organizerId, showId)

	@PostMapping("/api/organizer/shows/{showId}/timetable/stages")
	fun addStage(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @RequestBody request: StageRequest) =
		timetableService.addStage(organizerId, showId, request)

	@PutMapping("/api/organizer/shows/{showId}/timetable/stages/order")
	fun reorderStages(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @RequestBody request: StageOrderRequest) =
		timetableService.reorderStages(organizerId, showId, request)

	@PutMapping("/api/organizer/shows/{showId}/timetable/stages/{stageId}")
	fun renameStage(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@PathVariable stageId: Long,
		@RequestBody request: StageRequest,
	) = timetableService.renameStage(organizerId, showId, stageId, request)

	@DeleteMapping("/api/organizer/shows/{showId}/timetable/stages/{stageId}")
	fun deleteStage(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @PathVariable stageId: Long) =
		timetableService.deleteStage(organizerId, showId, stageId)

	@PostMapping("/api/organizer/shows/{showId}/timetable/slots")
	fun addSlot(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @RequestBody request: SlotRequest) =
		timetableService.addSlot(organizerId, showId, request)

	@PutMapping("/api/organizer/shows/{showId}/timetable/slots/{slotId}")
	fun updateSlot(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@PathVariable slotId: Long,
		@RequestBody request: SlotRequest,
	) = timetableService.updateSlot(organizerId, showId, slotId, request)

	@DeleteMapping("/api/organizer/shows/{showId}/timetable/slots/{slotId}")
	fun deleteSlot(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @PathVariable slotId: Long) =
		timetableService.deleteSlot(organizerId, showId, slotId)

	@PutMapping("/api/organizer/shows/{showId}/timetable/published")
	fun publish(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @RequestBody request: PublishRequest) =
		timetableService.publish(organizerId, showId, request)

	@PostMapping("/api/organizer/shows/{showId}/timetable/images")
	fun uploadImage(
		@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long,
		@PathVariable showId: Long,
		@RequestParam day: LocalDate,
		@RequestPart file: MultipartFile,
	) = timetableService.uploadImage(organizerId, showId, day, file.bytes, file.contentType)

	@DeleteMapping("/api/organizer/shows/{showId}/timetable/images/{imageId}")
	fun deleteImage(@SessionAttribute(OrganizerController.ORGANIZER_ID) organizerId: Long, @PathVariable showId: Long, @PathVariable imageId: Long) =
		timetableService.deleteImage(organizerId, showId, imageId)
}
