package com.ycc.log

import com.ycc.attendance.AttendanceRepository
import com.ycc.attendance.AttendanceStatus
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import com.ycc.user.Gender
import com.ycc.user.User
import com.ycc.user.UserRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.mock.web.MockMultipartFile
import org.springframework.web.server.ResponseStatusException
import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

@SpringBootTest
class LogServiceTests(
	@Autowired private val logService: LogService,
	@Autowired private val userRepository: UserRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val logRepository: ShowLogRepository,
	@Autowired private val clipRepository: ShowLogClipRepository,
	@Autowired private val attendanceRepository: AttendanceRepository,
	@Autowired private val storage: MediaStorage,
) {

	@TestConfiguration
	class FakeVideoConfig {
		@Bean
		@Primary
		fun fakeVideoProcessor() = object : VideoProcessor {
			override fun durationSeconds(video: Path) = Files.size(video) / 10.0

			override fun merge(clips: List<Path>, output: Path) {
				Files.createDirectories(output.parent)
				Files.writeString(output, "merged ${clips.size}: " + clips.joinToString(",") { it.fileName.toString().substringBefore('.') })
			}

			override fun thumbnail(video: Path, output: Path) {
				Files.writeString(output, "thumb")
			}
		}
	}

	private lateinit var me: User
	private lateinit var other: User
	private lateinit var pastShow: Show

	private fun clip(seconds: Int) = MockMultipartFile("file", "clip.mp4", "video/mp4", ByteArray(seconds * 10))

	private fun show(kopisId: String, date: String) = showRepository.save(
		Show(kopisId, "공연 $kopisId", LocalDate.parse(date), LocalDate.parse(date), "테스트홀", "http://example.com/p.jpg", null, null, null, null),
	)

	@AfterEach
	fun clear() {
		attendanceRepository.deleteAll()
		clipRepository.deleteAll()
		logRepository.deleteAll()
		showRepository.deleteAll()
		userRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		clear()
		me = userRepository.save(User(kakaoId = 1, nickname = "노을빛", gender = Gender.FEMALE))
		other = userRepository.save(User(kakaoId = 2, nickname = "새벽세시", gender = Gender.MALE))
		pastShow = show("PF1", "2026-10-01")
	}

	private fun publish(user: User, show: Show) {
		logService.uploadClip(user, show.id, Moment.ENTRY, clip(3))
		logService.publish(user, show.id, PublishLogRequest("바다로", "좋았다"))
	}

	@Test
	fun `같은 순간을 다시 찍으면 컷을 바꾸고, 1초 미만은 받지 않는다`() {
		logService.uploadClip(me, pastShow.id, Moment.GOODS, clip(3))
		val log = logService.uploadClip(me, pastShow.id, Moment.GOODS, clip(4))

		assertEquals(listOf(Moment.GOODS), log.clips.map { it.moment })
		assertEquals(4000, log.clips.single().durationMs)
		assertThrows<ResponseStatusException> { logService.uploadClip(me, pastShow.id, Moment.ENTRY, clip(0)) }
	}

	@Test
	fun `로그를 남기면 영상을 합치고 원본 컷은 지운다`() {
		logService.uploadClip(me, pastShow.id, Moment.GOODS, clip(3))
		logService.uploadClip(me, pastShow.id, Moment.AFTER, clip(2))

		val log = logService.publish(me, pastShow.id, PublishLogRequest(" 바다로 ", ""))

		assertEquals(LogStatus.READY, log.status)
		assertEquals("바다로", log.song)
		assertNull(log.note)
		assertEquals("merged 2: goods,after", Files.readString(logService.mediaFile(me, log.id, thumbnail = false)))
		assertTrue(clipRepository.findByLogId(log.id).all { it.path == null })
		assertFalse(Files.exists(storage.clipPath(log.id, Moment.GOODS, "mp4")))
	}

	@Test
	fun `컷은 찍은 순서와 상관없이 굿즈 줄, 입장 대기, 공연 직전, 끝나고 순으로 합친다`() {
		logService.uploadClip(me, pastShow.id, Moment.AFTER, clip(2))
		logService.uploadClip(me, pastShow.id, Moment.BEFORE_SHOW, clip(2))
		logService.uploadClip(me, pastShow.id, Moment.GOODS, clip(2))
		val draft = logService.uploadClip(me, pastShow.id, Moment.ENTRY, clip(2))

		assertEquals(listOf(Moment.GOODS, Moment.ENTRY, Moment.BEFORE_SHOW, Moment.AFTER), draft.clips.map { it.moment })
		val log = logService.publish(me, pastShow.id, PublishLogRequest(null, null))
		assertEquals(
			"merged 4: goods,entry,before_show,after",
			Files.readString(logService.mediaFile(me, log.id, thumbnail = false)),
		)
	}

	@Test
	fun `로그를 남기면 그 공연이 다녀옴으로 기록된다`() {
		publish(me, pastShow)

		val attendance = attendanceRepository.findByUserIdAndShowIdOrderByShowDate(me.id, pastShow.id).single()
		assertEquals(pastShow.startDate, attendance.showDate)
		assertEquals(AttendanceStatus.ATTENDED, attendance.status)
	}

	@Test
	fun `내 로그를 지우면 영상이 사라지고 다시 남길 수 있다`() {
		publish(me, pastShow)
		val log = logRepository.findByUserIdAndShowId(me.id, pastShow.id)!!
		val video = logService.mediaFile(me, log.id, thumbnail = false)

		assertThrows<ResponseStatusException> { logService.deleteLog(other, log.id) }
		logService.deleteLog(me, log.id)

		assertFalse(Files.exists(video))
		assertNull(logRepository.findByUserIdAndShowId(me.id, pastShow.id))
		logService.uploadClip(me, pastShow.id, Moment.ENTRY, clip(2))
	}

	@Test
	fun `로그는 남긴 사람만 볼 수 있다`() {
		publish(me, pastShow)
		val logId = logRepository.findByUserIdAndShowId(me.id, pastShow.id)!!.id

		assertEquals(1, logService.myLogs(me).size)
		assertEquals(0, logService.myLogs(other).size)
		assertThrows<ResponseStatusException> { logService.mediaFile(other, logId, thumbnail = false) }
	}
}
