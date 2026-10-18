package com.ycc.log

import com.ycc.show.Show
import com.ycc.show.ShowRepository
import com.ycc.user.User
import com.ycc.user.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.nio.file.Files
import java.nio.file.Path
import java.time.Clock
import java.time.LocalDate

@Service
@Transactional
class LogService(
	private val showRepository: ShowRepository,
	private val userRepository: UserRepository,
	private val logRepository: ShowLogRepository,
	private val clipRepository: ShowLogClipRepository,
	private val planRepository: ShowPlanRepository,
	private val signalRepository: LogSignalRepository,
	private val storage: MediaStorage,
	private val videoProcessor: VideoProcessor,
	private val clock: Clock,
) {

	fun showMe(user: User, showId: Long): ShowMeResponse {
		val log = logRepository.findByUserIdAndShowId(user.id, showId)
		return ShowMeResponse(planRepository.findByUserIdAndShowId(user.id, showId) != null, log?.let(::toMyLog))
	}

	fun plan(user: User, showId: Long) {
		if (planRepository.findByUserIdAndShowId(user.id, showId) == null) {
			planRepository.save(ShowPlan(user, findShow(showId)))
		}
	}

	fun unplan(user: User, showId: Long) {
		planRepository.findByUserIdAndShowId(user.id, showId)?.let(planRepository::delete)
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
			visibility = request.visibility
			status = LogStatus.READY
			videoPath = storage.relativize(video)
			thumbnailPath = storage.relativize(thumbnail)
		}
		return toMyLog(log)
	}

	fun deleteLog(user: User, logId: Long) {
		val log = logRepository.findById(logId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		if (log.user.id != user.id) throw ResponseStatusException(HttpStatus.NOT_FOUND)
		clipsInOrder(log.id).forEach { storage.delete(it.path) }
		storage.delete(log.videoPath)
		storage.delete(log.thumbnailPath)
		signalRepository.deleteForUserAndShow(user.id, log.show.id, SignalKind.WAS_THERE)
		clipRepository.deleteAll(clipRepository.findByLogId(log.id))
		logRepository.delete(log)
	}

	@Transactional(readOnly = true)
	fun logsOf(viewer: User, userId: Long): List<LogResponse> =
		logRepository.findReadyByUser(userId)
			.filter { viewer.id == userId || it.visibility == Visibility.PUBLIC }
			.map(::toLog)

	@Transactional(readOnly = true)
	fun profile(userId: Long): UserProfileResponse {
		val user = userRepository.findById(userId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		val count = logRepository.findReadyByUser(userId).count { it.visibility == Visibility.PUBLIC }
		return UserProfileResponse(user.id, user.nickname, count)
	}

	@Transactional(readOnly = true)
	fun log(viewer: User, logId: Long): LogResponse = toLog(findVisible(viewer, logId))

	@Transactional(readOnly = true)
	fun mediaFile(viewer: User, logId: Long, thumbnail: Boolean): Path {
		val log = findVisible(viewer, logId)
		return storage.resolve((if (thumbnail) log.thumbnailPath else log.videoPath)!!)
	}

	private fun findVisible(viewer: User, logId: Long): ShowLog {
		val log = logRepository.findById(logId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		val visible = log.status == LogStatus.READY && (log.user.id == viewer.id || log.visibility == Visibility.PUBLIC)
		if (!visible) throw ResponseStatusException(HttpStatus.NOT_FOUND)
		return log
	}

	@Transactional(readOnly = true)
	fun pastFeed(viewer: User): List<PastFeedItem> =
		logRepository.findReadyByUser(viewer.id).map { mine ->
			val people = logRepository.findPublicByShowExcept(mine.show.id, viewer.id).map { person(viewer, it.user, mine.show.id, it) }
			PastFeedItem(FeedShow.from(mine.show), mine.id, people)
		}

	@Transactional(readOnly = true)
	fun nextFeed(viewer: User): List<NextFeedItem> =
		planRepository.findUpcomingByUser(viewer.id, LocalDate.now(clock)).map { plan ->
			val people = planRepository.findByShowExcept(plan.show.id, viewer.id).map { other ->
				val latest = logRepository.findReadyByUser(other.user.id).firstOrNull { it.visibility == Visibility.PUBLIC }
				person(viewer, other.user, plan.show.id, latest)
			}
			NextFeedItem(FeedShow.from(plan.show), people)
		}

	fun signal(viewer: User, toUserId: Long, showId: Long, kind: SignalKind) {
		if (toUserId == viewer.id) throw badRequest("나에게는 보낼 수 없어요.")
		val target = userRepository.findById(toUserId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		val allowed = when (kind) {
			SignalKind.WAS_THERE -> hasReadyLog(viewer.id, showId) && hasReadyLog(toUserId, showId)
			SignalKind.NEXT_TOGETHER -> hasPlan(viewer.id, showId) && hasPlan(toUserId, showId)
		}
		if (!allowed) throw ResponseStatusException(HttpStatus.FORBIDDEN, "같은 공연에 함께한 사람에게만 보낼 수 있어요.")
		if (!signalRepository.existsByFromUserIdAndToUserIdAndShowIdAndKind(viewer.id, toUserId, showId, kind)) {
			signalRepository.save(LogSignal(viewer, target, findShow(showId), kind))
		}
	}

	fun cancelSignal(viewer: User, toUserId: Long, showId: Long, kind: SignalKind) {
		signalRepository.findByFromUserIdAndToUserIdAndShowIdAndKind(viewer.id, toUserId, showId, kind)?.let(signalRepository::delete)
	}

	private fun person(viewer: User, other: User, showId: Long, log: ShowLog?): FeedPerson {
		val sentNext = sent(viewer.id, other.id, showId, SignalKind.NEXT_TOGETHER)
		return FeedPerson(
			userId = other.id,
			nickname = other.nickname,
			log = log?.let(::toLog),
			wasThereSent = sent(viewer.id, other.id, showId, SignalKind.WAS_THERE),
			nextTogetherSent = sentNext,
			nextTogetherMatched = sentNext && sent(other.id, viewer.id, showId, SignalKind.NEXT_TOGETHER),
		)
	}

	private fun sent(from: Long, to: Long, showId: Long, kind: SignalKind) =
		signalRepository.existsByFromUserIdAndToUserIdAndShowIdAndKind(from, to, showId, kind)

	private fun hasReadyLog(userId: Long, showId: Long) =
		logRepository.existsByUserIdAndShowIdAndStatus(userId, showId, LogStatus.READY)

	private fun hasPlan(userId: Long, showId: Long) = planRepository.findByUserIdAndShowId(userId, showId) != null

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
		visibility = log.visibility,
	)

	private fun toLog(log: ShowLog) = LogResponse(
		id = log.id,
		userId = log.user.id,
		nickname = log.user.nickname,
		showId = log.show.id,
		showName = log.show.name,
		showStartDate = log.show.startDate,
		song = log.song,
		note = log.note,
		visibility = log.visibility,
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
