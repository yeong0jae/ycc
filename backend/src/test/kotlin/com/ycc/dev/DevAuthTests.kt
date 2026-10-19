package com.ycc.dev

import com.ycc.user.User
import com.ycc.user.UserRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import jakarta.servlet.http.Cookie

@SpringBootTest
@AutoConfigureMockMvc
class DevAuthTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val developerRepository: DeveloperRepository,
	@Autowired private val userRepository: UserRepository,
	@Autowired private val passwordEncoder: PasswordEncoder,
) {

	@BeforeEach
	fun setUp() {
		developerRepository.deleteAll()
		userRepository.deleteAll()
		developerRepository.save(Developer("dev", passwordEncoder.encode("correct-horse")!!))
		userRepository.save(User(kakaoId = 1001))
	}

	private fun login(password: String) = mockMvc.post("/api/dev/login") {
		contentType = MediaType.APPLICATION_JSON
		content = """{"username":"dev","password":"$password"}"""
	}

	private fun sessionCookie(password: String): Cookie = login(password).andReturn().response.getCookie("SESSION")!!

	@Test
	fun `로그인하지 않으면 개발자 API는 401`() {
		mockMvc.get("/api/dev/shows").andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/dev/me").andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `카카오로 로그인한 사용자도 개발자 API는 401`() {
		val kakao = oauth2Login().oauth2User(DefaultOAuth2User(listOf(SimpleGrantedAuthority("OAUTH2_USER")), mapOf("id" to 1001L), "id"))
		mockMvc.get("/api/dev/shows") { with(kakao) }.andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `비밀번호가 틀리면 401`() {
		login("wrong").andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `로그인하면 개발자 API를 쓸 수 있고, 로그아웃하면 다시 401`() {
		val session = sessionCookie("correct-horse")

		mockMvc.get("/api/dev/me") { cookie(session) }.andExpect {
			status { isOk() }
			jsonPath("$.username") { value("dev") }
		}
		mockMvc.get("/api/dev/shows") { cookie(session) }.andExpect { status { isOk() } }

		mockMvc.post("/api/dev/logout") { cookie(session) }.andExpect { status { isOk() } }
		mockMvc.get("/api/dev/shows") { cookie(session) }.andExpect { status { isUnauthorized() } }
	}
}
