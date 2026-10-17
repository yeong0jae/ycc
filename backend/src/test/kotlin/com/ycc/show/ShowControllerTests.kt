package com.ycc.show

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
class ShowControllerTests(@Autowired private val mockMvc: MockMvc) {

	@TestConfiguration
	class FixedClockConfig {
		@Bean
		@Primary
		fun fixedClock(): Clock = Clock.fixed(Instant.parse("2026-10-18T03:00:00Z"), ZoneId.of("Asia/Seoul"))
	}

	@Test
	fun `목록은 종료된 공연을 빼고 시작일 순으로 준다`() {
		mockMvc.get("/api/shows").andExpect {
			status { isOk() }
			jsonPath("$.length()") { value(7) }
			jsonPath("$[0].name") { value("해파랑 밴드 전국투어 서울") }
			jsonPath("$[1].name") { value("Neon Harbor 내한 공연") }
		}
	}

	@Test
	fun `상세는 라인업을 목록으로 준다`() {
		mockMvc.get("/api/shows/4").andExpect {
			status { isOk() }
			jsonPath("$.lineup[0]") { value("해파랑 밴드") }
			jsonPath("$.lineup.length()") { value(2) }
		}
	}

	@Test
	fun `없는 공연은 404`() {
		mockMvc.get("/api/shows/999").andExpect {
			status { isNotFound() }
		}
	}
}
