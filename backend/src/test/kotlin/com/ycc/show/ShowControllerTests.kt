package com.ycc.festival

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
import java.time.ZoneId

@SpringBootTest
@AutoConfigureMockMvc
class FestivalControllerTests(@Autowired private val mockMvc: MockMvc) {

	@TestConfiguration
	class FixedClockConfig {
		@Bean
		@Primary
		fun fixedClock(): Clock = Clock.fixed(Instant.parse("2026-10-18T03:00:00Z"), ZoneId.of("Asia/Seoul"))
	}

	@Test
	fun `목록은 종료된 페스티벌을 빼고 시작일 순으로 준다`() {
		mockMvc.get("/api/festivals").andExpect {
			status { isOk() }
			jsonPath("$.length()") { value(7) }
			jsonPath("$[0].name") { value("서울 인디 나잇") }
			jsonPath("$[1].name") { value("그린 캠핑 뮤직 페스타") }
		}
	}

	@Test
	fun `상세는 라인업을 목록으로 준다`() {
		mockMvc.get("/api/festivals/4").andExpect {
			status { isOk() }
			jsonPath("$.lineup[0]") { value("밴드 I") }
			jsonPath("$.lineup.length()") { value(3) }
		}
	}

	@Test
	fun `없는 페스티벌은 404`() {
		mockMvc.get("/api/festivals/999").andExpect {
			status { isNotFound() }
		}
	}
}
