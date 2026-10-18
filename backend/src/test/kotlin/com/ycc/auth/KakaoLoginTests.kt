package com.ycc.auth

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import kotlin.test.assertTrue

@SpringBootTest
@AutoConfigureMockMvc
class KakaoLoginTests(@Autowired private val mockMvc: MockMvc) {

	@Test
	fun `카카오 로그인은 카카오 인증 화면으로 보낸다`() {
		val location = mockMvc.get("/oauth2/authorization/kakao").andExpect {
			status { is3xxRedirection() }
		}.andReturn().response.getHeader("Location")!!

		assertTrue(location.startsWith("https://kauth.kakao.com/oauth/authorize"))
		assertTrue("client_id=test-client-id" in location)
		assertTrue("state=" in location)
	}

	@Test
	fun `콘서트 API는 로그인 없이 볼 수 있다`() {
		mockMvc.get("/api/shows").andExpect { status { isOk() } }
	}
}
