package com.ycc.log

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
	@Autowired private val planRepository: ShowPlanRepository,
	@Autowired private val signalRepository: LogSignalRepository,
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
	private lateinit var nextShow: Show

	private fun clip(seconds: Int) = MockMultipartFile("file", "clip.mp4", "video/mp4", ByteArray(seconds * 10))

	private fun show(kopisId: String, date: String) = showRepository.save(
		Show(kopisId, "공연 $kopisId", LocalDate.parse(date), LocalDate.parse(date), "테스트홀", "http://example.com/p.jpg", null, null, null, null),
	)

	@AfterEach
	fun clear() {
		signalRepository.deleteAll()
		clipRepository.deleteAll()
		logRepository.deleteAll()
		planRepository.deleteAll()
		showRepository.deleteAll()
		userRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		clear()
		me = userRepository.save(User(kakaoId = 1, nickname = "노을빛", gender = Gender.FEMALE))
		other = userRepository.save(User(kakaoId = 2, nickname = "새벽세시", gender = Gender.MALE))
		pastShow = show("PF1", "2026-10-01")
		nextShow = show("PF2", "2099-12-31")
	}

	private fun publish(user: User, show: Show, visibility: Visibility = Visibility.PUBLIC) {
		logService.uploadClip(user, show.id, Moment.ENTRY, clip(3))
		logService.publish(user, show.id, PublishLogRequest("바다로", "좋았다", visibility))
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

		val log = logService.publish(me, pastShow.id, PublishLogRequest(" 바다로 ", "", Visibility.PUBLIC))

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
		val log = logService.publish(me, pastShow.id, PublishLogRequest(null, null, Visibility.PUBLIC))
		assertEquals(
			"merged 4: goods,entry,before_show,after",
			Files.readString(logService.mediaFile(me, log.id, thumbnail = false)),
		)
	}

	@Test
	fun `내 로그를 지우면 영상과 나도 있었어 신호가 사라지고 다시 남길 수 있다`() {
		publish(me, pastShow)
		publish(other, pastShow)
		logService.signal(other, me.id, pastShow.id, SignalKind.WAS_THERE)
		val log = logRepository.findByUserIdAndShowId(me.id, pastShow.id)!!
		val video = logService.mediaFile(me, log.id, thumbnail = false)

		assertThrows<ResponseStatusException> { logService.deleteLog(other, log.id) }
		logService.deleteLog(me, log.id)

		assertFalse(Files.exists(video))
		assertNull(logRepository.findByUserIdAndShowId(me.id, pastShow.id))
		assertEquals(0, signalRepository.count())
		logService.uploadClip(me, pastShow.id, Moment.ENTRY, clip(2))
	}

	@Test
	fun `나만 보기 로그는 다른 사람에게 보이지 않는다`() {
		publish(me, pastShow, Visibility.PRIVATE)
		val logId = logRepository.findByUserIdAndShowId(me.id, pastShow.id)!!.id

		assertEquals(1, logService.logsOf(me, me.id).size)
		assertEquals(0, logService.logsOf(other, me.id).size)
		assertThrows<ResponseStatusException> { logService.mediaFile(other, logId, thumbnail = false) }
	}

	@Test
	fun `다녀온 공연 피드에는 같은 공연의 다른 사람 공개 로그가 보인다`() {
		publish(me, pastShow)
		publish(other, pastShow)

		val item = logService.pastFeed(me).single()
		assertEquals(pastShow.id, item.show.id)
		assertEquals(listOf("새벽세시"), item.people.map { it.nickname })
	}

	@Test
	fun `나도 거기 있었어는 둘 다 그 공연 로그가 있어야 보낼 수 있다`() {
		publish(me, pastShow)

		assertThrows<ResponseStatusException> { logService.signal(me, other.id, pastShow.id, SignalKind.WAS_THERE) }
		publish(other, pastShow)
		logService.signal(me, other.id, pastShow.id, SignalKind.WAS_THERE)
		assertTrue(logService.pastFeed(me).single().people.single().wasThereSent)
	}

	@Test
	fun `다음엔 같이는 서로 눌렀을 때만 연결된다`() {
		logService.plan(me, nextShow.id)
		logService.plan(other, nextShow.id)

		logService.signal(me, other.id, nextShow.id, SignalKind.NEXT_TOGETHER)
		val mineOnly = logService.nextFeed(me).single().people.single()
		assertTrue(mineOnly.nextTogetherSent)
		assertFalse(mineOnly.nextTogetherMatched)
		assertFalse(logService.nextFeed(other).single().people.single().nextTogetherMatched)

		logService.signal(other, me.id, nextShow.id, SignalKind.NEXT_TOGETHER)
		assertTrue(logService.nextFeed(me).single().people.single().nextTogetherMatched)
	}
}
