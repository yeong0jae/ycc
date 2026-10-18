package com.ycc.show

import com.ycc.facility.Facility
import com.ycc.facility.FacilityRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@SpringBootTest
@AutoConfigureMockMvc
class ShowControllerTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val facilityRepository: FacilityRepository,
) {

	@TestConfiguration
	class FixedClockConfig {
		@Bean
		@Primary
		fun fixedClock(): Clock = Clock.fixed(Instant.parse("2026-10-18T03:00:00Z"), ZoneId.of("Asia/Seoul"))
	}

	private fun show(kopisId: String, name: String, start: String, end: String, facility: Facility? = null) = Show(
		kopisId = kopisId,
		name = name,
		startDate = LocalDate.parse(start),
		endDate = LocalDate.parse(end),
		venue = "테스트홀",
		posterUrl = "http://example.com/$kopisId.jpg",
		ticketUrl = "https://example.com/tickets/$kopisId",
		officialUrl = null,
		scheduleGuide = "토요일(18:00)",
		priceGuide = "전석 110,000원",
		facility = facility,
		reviewStatus = ReviewStatus.VISIBLE,
	)

	@BeforeEach
	fun setUp() {
		showRepository.deleteAll()
		facilityRepository.deleteAll()
		val hall = facilityRepository.save(Facility("FC1", "테스트홀", "서울 마포구", 37.55, 126.92))
		showRepository.saveAll(
			listOf(
				show("PF0", "3개월 넘게 지난 공연", "2026-07-01", "2026-07-01"),
				show("PF1", "끝난 공연", "2026-10-01", "2026-10-01"),
				show("PF2", "나중 공연", "2026-12-05", "2026-12-05", hall),
				show("PF3", "진행 중인 공연", "2026-10-17", "2026-10-18"),
			),
		)
	}

	@Test
	fun `다가오는 공연은 아직 시작하지 않은 공연을 시작일 순으로 준다`() {
		mockMvc.get("/api/shows").andExpect {
			status { isOk() }
			jsonPath("$.items.length()") { value(1) }
			jsonPath("$.items[0].name") { value("나중 공연") }
			jsonPath("$.hasNext") { value(false) }
		}
	}

	@Test
	fun `진행 중인 공연은 오늘이 공연 기간 안인 공연을 끝나는 날 순으로 준다`() {
		showRepository.save(show("PF4", "더 길게 하는 공연", "2026-10-01", "2026-10-31"))

		mockMvc.get("/api/shows?when=ONGOING").andExpect {
			jsonPath("$.items.length()") { value(2) }
			jsonPath("$.items[0].name") { value("진행 중인 공연") }
			jsonPath("$.items[1].name") { value("더 길게 하는 공연") }
		}
	}

	@Test
	fun `지난 공연은 최근 것부터 준다`() {
		mockMvc.get("/api/shows?when=PAST").andExpect {
			jsonPath("$.items.length()") { value(2) }
			jsonPath("$.items[0].name") { value("끝난 공연") }
			jsonPath("$.items[1].name") { value("3개월 넘게 지난 공연") }
		}
	}

	@Test
	fun `이름으로 검색한다`() {
		mockMvc.get("/api/shows?when=PAST&q=3개월").andExpect {
			jsonPath("$.items.length()") { value(1) }
			jsonPath("$.items[0].name") { value("3개월 넘게 지난 공연") }
		}
	}

	@Test
	fun `검수 대기나 무시한 공연은 찾기에 나오지 않는다`() {
		showRepository.save(show("PX1", "대기 공연", "2026-11-01", "2026-11-01").apply { reviewStatus = ReviewStatus.PENDING })
		showRepository.save(show("PX2", "무시한 공연", "2026-11-01", "2026-11-01").apply { reviewStatus = ReviewStatus.HIDDEN })

		mockMvc.get("/api/shows").andExpect {
			jsonPath("$.items.length()") { value(1) }
			jsonPath("$.items[0].name") { value("나중 공연") }
		}
	}

	@Test
	fun `한 페이지에 20개씩 준다`() {
		showRepository.saveAll((1..21).map { show("PX$it", "많은 공연 $it", "2026-11-01", "2026-11-01") })

		mockMvc.get("/api/shows?q=많은").andExpect {
			jsonPath("$.items.length()") { value(20) }
			jsonPath("$.hasNext") { value(true) }
		}
		mockMvc.get("/api/shows?q=많은&page=1").andExpect {
			jsonPath("$.items.length()") { value(1) }
			jsonPath("$.hasNext") { value(false) }
		}
	}

	@Test
	fun `상세는 회차·가격 안내와 지도에 표시할 공연장 ID를 준다`() {
		val id = showRepository.findByKopisId("PF2")!!.id
		val facilityId = facilityRepository.findByKopisId("FC1")!!.id
		mockMvc.get("/api/shows/$id").andExpect {
			status { isOk() }
			jsonPath("$.facilityId") { value(facilityId) }
			jsonPath("$.scheduleGuide") { value("토요일(18:00)") }
			jsonPath("$.priceGuide") { value("전석 110,000원") }
		}
	}

	@Test
	fun `없는 공연은 404`() {
		mockMvc.get("/api/shows/999999").andExpect {
			status { isNotFound() }
		}
	}
}
