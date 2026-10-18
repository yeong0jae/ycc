package com.ycc.user

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.put
import kotlin.test.assertEquals

@SpringBootTest
@AutoConfigureMockMvc
class MeControllerTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val userRepository: UserRepository,
) {

	private fun loginAs(kakaoId: Long) =
		oauth2Login().oauth2User(DefaultOAuth2User(listOf(SimpleGrantedAuthority("OAUTH2_USER")), mapOf("id" to kakaoId), "id"))

	@BeforeEach
	fun setUp() {
		userRepository.deleteAll()
		userRepository.save(User(kakaoId = 1001))
		userRepository.save(User(kakaoId = 2002, nickname = "노을빛", gender = Gender.FEMALE))
	}

	@Test
	fun `로그인하지 않으면 401`() {
		mockMvc.get("/api/me").andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `처음 로그인한 사용자는 시작 설정 전 상태다`() {
		mockMvc.get("/api/me") { with(loginAs(1001)) }.andExpect {
			status { isOk() }
			jsonPath("$.onboarded") { value(false) }
		}
	}

	@Test
	fun `닉네임과 성별을 저장하면 시작 설정이 끝난다`() {
		mockMvc.put("/api/me") {
			with(loginAs(1001))
			contentType = MediaType.APPLICATION_JSON
			content = """{"nickname": " 새벽세시 ", "gender": "MALE"}"""
		}.andExpect {
			status { isOk() }
			jsonPath("$.nickname") { value("새벽세시") }
			jsonPath("$.onboarded") { value(true) }
		}
		assertEquals(Gender.MALE, userRepository.findByKakaoId(1001)!!.gender)
	}

	@Test
	fun `닉네임이 너무 짧으면 400`() {
		mockMvc.put("/api/me") {
			with(loginAs(1001))
			contentType = MediaType.APPLICATION_JSON
			content = """{"nickname": "a", "gender": "FEMALE"}"""
		}.andExpect { status { isBadRequest() } }
	}

	@Test
	fun `다른 사람이 쓰는 닉네임이면 409`() {
		mockMvc.put("/api/me") {
			with(loginAs(1001))
			contentType = MediaType.APPLICATION_JSON
			content = """{"nickname": "노을빛", "gender": "FEMALE"}"""
		}.andExpect { status { isConflict() } }
	}
}
