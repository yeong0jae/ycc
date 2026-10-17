package com.ycc.show

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
) {

	@TestConfiguration
	class FixedClockConfig {
		@Bean
		@Primary
		fun fixedClock(): Clock = Clock.fixed(Instant.parse("2026-10-18T03:00:00Z"), ZoneId.of("Asia/Seoul"))
	}

	private fun show(kopisId: String, name: String, start: String, end: String) = Show(
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
	)

	@BeforeEach
	fun setUp() {
		showRepository.deleteAll()
		showRepository.saveAll(
			listOf(
				show("PF1", "끝난 공연", "2026-10-01", "2026-10-01"),
				show("PF2", "나중 공연", "2026-12-05", "2026-12-05"),
				show("PF3", "진행 중인 공연", "2026-10-17", "2026-10-18"),
			),
		)
	}

	@Test
	fun `목록은 종료된 공연을 빼고 시작일 순으로 준다`() {
		mockMvc.get("/api/shows").andExpect {
			status { isOk() }
			jsonPath("$.length()") { value(2) }
			jsonPath("$[0].name") { value("진행 중인 공연") }
			jsonPath("$[1].name") { value("나중 공연") }
		}
	}

	@Test
	fun `상세는 회차와 가격 안내를 준다`() {
		val id = showRepository.findByKopisId("PF2")!!.id
		mockMvc.get("/api/shows/$id").andExpect {
			status { isOk() }
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
