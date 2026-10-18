package com.ycc.log

import com.ycc.attendance.AttendanceService
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import com.ycc.user.User
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.nio.file.Files
import java.nio.file.Path

@Service
@Transactional
class LogService(
	private val showRepository: ShowRepository,
	private val logRepository: ShowLogRepository,
	private val clipRepository: ShowLogClipRepository,
	private val attendanceService: AttendanceService,
	private val storage: MediaStorage,
	private val videoProcessor: VideoProcessor,
) {

	fun showMe(user: User, showId: Long): ShowMeResponse {
		val log = logRepository.findByUserIdAndShowId(user.id, showId)
		return ShowMeResponse(attendanceService.mine(user, showId), log?.let(::toMyLog))
	}

	fun uploadClip(user: User, showId: Long, moment: Moment, file: MultipartFile): MyLogResponse {
		if (file.isEmpty) throw badRequest("영상이 비어 있어요.")
		val show = findShow(showId)
		val log = logRepository.findByUserIdAndShowId(user.id, showId) ?: logRepository.save(ShowLog(user, show))
		if (log.status == LogStatus.READY) throw ResponseStatusException(HttpStatus.CONFLICT, "이미 남긴 로그예요.")

		val extension = file.originalFilename?.substringAfterLast('.', "")?.lowercase()?.takeIf { it in EXTENSIONS } ?: "mp4"
		val target = storage.clipPath(log.id, moment, extension)
		val temp = Files.createTempFile("clip-", ".$extension")
		try {
			file.inputStream.use { storage.write(it, temp) }
			val seconds = videoProcessor.durationSeconds(temp)
			if (seconds < MIN_SECONDS) throw badRequest("1초 이상 찍어 주세요.")
			val existing = clipRepository.findByLogIdAndMoment(log.id, moment)
			storage.delete(existing?.path)
			Files.newInputStream(temp).use { storage.write(it, target) }
			val durationMs = (minOf(seconds, FfmpegVideoProcessor.CLIP_SECONDS.toDouble()) * 1000).toInt()
			val path = storage.relativize(target)
			if (existing == null) clipRepository.save(ShowLogClip(log, moment, durationMs, path))
			else existing.apply { this.durationMs = durationMs; this.path = path }
		} finally {
			Files.deleteIfExists(temp)
		}
		return toMyLog(log)
	}

	fun deleteClip(user: User, showId: Long, moment: Moment): MyLogResponse {
		val log = findDraft(user, showId)
		clipRepository.findByLogIdAndMoment(log.id, moment)?.let {
			storage.delete(it.path)
			clipRepository.delete(it)
		}
		return toMyLog(log)
	}

	fun publish(user: User, showId: Long, request: PublishLogRequest): MyLogResponse {
		val log = findDraft(user, showId)
		val clips = clipsInOrder(log.id)
		if (clips.isEmpty()) throw badRequest("한 컷 이상 찍어 주세요.")

		val video = storage.videoPath(log.id)
		val thumbnail = storage.thumbnailPath(log.id)
		videoProcessor.merge(clips.map { storage.resolve(it.path!!) }, video)
		videoProcessor.thumbnail(video, thumbnail)
		clips.forEach {
			storage.delete(it.path)
			it.path = null
		}
		log.apply {
			song = request.song?.trim()?.take(100)?.ifBlank { null }
			note = request.note?.trim()?.take(100)?.ifBlank { null }
			status = LogStatus.READY
			videoPath = storage.relativize(video)
			thumbnailPath = storage.relativize(thumbnail)
		}
		attendanceService.markAttended(user, log.show)
		return toMyLog(log)
	}

	fun deleteLog(user: User, logId: Long) {
		val log = logRepository.findById(logId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		if (log.user.id != user.id) throw ResponseStatusException(HttpStatus.NOT_FOUND)
		clipsInOrder(log.id).forEach { storage.delete(it.path) }
		storage.delete(log.videoPath)
		storage.delete(log.thumbnailPath)
		clipRepository.deleteAll(clipRepository.findByLogId(log.id))
		logRepository.delete(log)
	}

	@Transactional(readOnly = true)
	fun myLogs(user: User): List<LogResponse> = logRepository.findReadyByUser(user.id).map(::toLog)

	@Transactional(readOnly = true)
	fun log(viewer: User, logId: Long): LogResponse = toLog(findVisible(viewer, logId))

	@Transactional(readOnly = true)
	fun mediaFile(viewer: User, logId: Long, thumbnail: Boolean): Path {
		val log = findVisible(viewer, logId)
		return storage.resolve((if (thumbnail) log.thumbnailPath else log.videoPath)!!)
	}

	private fun findVisible(viewer: User, logId: Long): ShowLog {
		val log = logRepository.findById(logId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		val visible = log.status == LogStatus.READY && log.user.id == viewer.id
		if (!visible) throw ResponseStatusException(HttpStatus.NOT_FOUND)
		return log
	}

	private fun findShow(showId: Long): Show =
		showRepository.findById(showId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }

	private fun findDraft(user: User, showId: Long): ShowLog {
		val log = logRepository.findByUserIdAndShowId(user.id, showId) ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
		if (log.status == LogStatus.READY) throw ResponseStatusException(HttpStatus.CONFLICT, "이미 남긴 로그예요.")
		return log
	}

	private fun toMyLog(log: ShowLog) = MyLogResponse(
		id = log.id,
		status = log.status,
		clips = clipsInOrder(log.id).map { ClipResponse(it.moment, it.durationMs) },
		song = log.song,
		note = log.note,
	)

	private fun toLog(log: ShowLog) = LogResponse(
		id = log.id,
		showId = log.show.id,
		showName = log.show.name,
		showStartDate = log.show.startDate,
		song = log.song,
		note = log.note,
		cutCount = clipRepository.countByLogId(log.id).toInt(),
		videoUrl = "/api/logs/${log.id}/video",
		thumbnailUrl = "/api/logs/${log.id}/thumbnail",
	)

	private fun clipsInOrder(logId: Long) = clipRepository.findByLogId(logId).sortedBy { it.moment.ordinal }

	private fun badRequest(message: String) = ResponseStatusException(HttpStatus.BAD_REQUEST, message)

	companion object {
		private const val MIN_SECONDS = 1.0
		private val EXTENSIONS = setOf("mp4", "mov", "webm", "m4v")
	}
}
