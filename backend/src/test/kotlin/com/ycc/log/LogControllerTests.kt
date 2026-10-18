package com.ycc.log

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@SpringBootTest
@AutoConfigureMockMvc
class LogControllerTests(@Autowired private val mockMvc: MockMvc) {

	@Test
	fun `로그 API는 로그인이 필요하다`() {
		mockMvc.get("/api/me/logs").andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/logs/1/video").andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/home").andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/me/records").andExpect { status { isUnauthorized() } }
	}
}
