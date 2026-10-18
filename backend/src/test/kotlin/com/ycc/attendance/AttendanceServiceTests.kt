package com.ycc.attendance

import com.ycc.log.LogStatus
import com.ycc.log.ShowLog
import com.ycc.log.ShowLogRepository
import com.ycc.show.Show
import com.ycc.show.ShowRepository
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
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlin.test.assertEquals

@SpringBootTest
class AttendanceServiceTests(
	@Autowired private val attendanceService: AttendanceService,
	@Autowired private val attendanceRepository: AttendanceRepository,
	@Autowired private val logRepository: ShowLogRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val userRepository: UserRepository,
) {

	@TestConfiguration
	class FixedClockConfig {
		@Bean
		@Primary
		fun fixedClock(): Clock = Clock.fixed(Instant.parse("2026-10-18T03:00:00Z"), ZoneId.of("Asia/Seoul"))
	}

	private lateinit var me: User

	private fun show(name: String, start: String, end: String = start, venue: String = "롤링홀") = showRepository.save(
		Show("PF-$name", name, LocalDate.parse(start), LocalDate.parse(end), venue, "http://example.com/p.jpg", null, null, null, null),
	)

	private fun date(value: String) = LocalDate.parse(value)

	@AfterEach
	fun clear() {
		attendanceRepository.deleteAll()
		logRepository.deleteAll()
		showRepository.deleteAll()
		userRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		clear()
		me = userRepository.save(User(kakaoId = 1, nickname = "노을빛"))
	}

	@Test
	fun `이틀짜리 공연은 둘째 날만 골라 기록할 수 있다`() {
		val show = show("투데이", "2026-10-24", "2026-10-25")

		val mine = attendanceService.set(me, show.id, date("2026-10-25"), AttendanceStatus.GOING)

		assertEquals(listOf(AttendanceResponse(date("2026-10-25"), AttendanceStatus.GOING)), mine)
	}

	@Test
	fun `공연 기간 밖 날짜와 아직 오지 않은 날의 다녀옴은 받지 않는다`() {
		val show = show("미래", "2026-10-24")

		assertThrows<ResponseStatusException> { attendanceService.set(me, show.id, date("2026-10-23"), AttendanceStatus.GOING) }
		assertThrows<ResponseStatusException> { attendanceService.set(me, show.id, date("2026-10-24"), AttendanceStatus.ATTENDED) }
	}

	@Test
	fun `같은 날을 다시 남기면 상태만 바꾸고, 지우면 사라진다`() {
		val show = show("오늘", "2026-10-18")

		attendanceService.set(me, show.id, date("2026-10-18"), AttendanceStatus.GOING)
		val changed = attendanceService.set(me, show.id, date("2026-10-18"), AttendanceStatus.ATTENDED)

		assertEquals(listOf(AttendanceStatus.ATTENDED), changed.map { it.status })
		assertEquals(emptyList(), attendanceService.delete(me, show.id, date("2026-10-18")))
	}

	@Test
	fun `홈은 다가오는 공연을 가까운 순으로, 로그가 없는 지난 공연을 최근 순으로 준다`() {
		val far = show("먼 공연", "2026-12-01")
		val near = show("가까운 공연", "2026-10-20")
		val logged = show("로그 남긴 공연", "2026-10-10")
		val empty = show("기록 빈 공연", "2026-10-12")
		attendanceService.set(me, far.id, far.startDate, AttendanceStatus.GOING)
		attendanceService.set(me, near.id, near.startDate, AttendanceStatus.GOING)
		attendanceService.set(me, logged.id, logged.startDate, AttendanceStatus.ATTENDED)
		attendanceService.set(me, empty.id, empty.startDate, AttendanceStatus.GOING)
		logRepository.save(ShowLog(me, logged, status = LogStatus.READY))

		val home = attendanceService.home(me)

		assertEquals(listOf("가까운 공연", "먼 공연"), home.upcoming.map { it.showName })
		assertEquals(listOf("기록 빈 공연"), home.unrecorded.map { it.showName })
	}

	@Test
	fun `연대기는 다녀온 공연만 연도별로 묶고 올해 관람 수와 가장 많이 간 공연장을 센다`() {
		val shows = listOf(
			show("올해 1", "2026-10-01"),
			show("올해 2", "2026-09-01", venue = "올림픽홀"),
			show("작년", "2025-11-02"),
			show("갈 예정", "2026-11-01"),
		)
		shows.take(3).forEach { attendanceService.set(me, it.id, it.startDate, AttendanceStatus.ATTENDED) }
		attendanceService.set(me, shows[3].id, shows[3].startDate, AttendanceStatus.GOING)

		val records = attendanceService.records(me)

		assertEquals(listOf(2026, 2025), records.years.map { it.year })
		assertEquals(listOf("올해 1", "올해 2"), records.years[0].items.map { it.showName })
		assertEquals(RecordStats(thisYear = 2, total = 3, topVenue = VenueCount("롤링홀", 2)), records.stats)
	}
}
