package com.ycc.request

import com.ycc.dev.Developer
import com.ycc.dev.DeveloperRepository
import com.ycc.show.ShowKind
import com.ycc.user.User
import com.ycc.user.UserRepository
import jakarta.servlet.http.Cookie
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
import org.springframework.test.web.servlet.put
import kotlin.test.assertEquals
import kotlin.test.assertNull

@SpringBootTest
@AutoConfigureMockMvc
class ShowRequestTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val showRequestRepository: ShowRequestRepository,
	@Autowired private val userRepository: UserRepository,
	@Autowired private val developerRepository: DeveloperRepository,
	@Autowired private val passwordEncoder: PasswordEncoder,
) {

	@BeforeEach
	fun setUp() {
		showRequestRepository.deleteAll()
		developerRepository.deleteAll()
		userRepository.deleteAll()
		userRepository.save(User(kakaoId = 1001, nickname = "노을빛"))
		developerRepository.save(Developer("dev", passwordEncoder.encode("correct-horse")!!))
	}

	private fun send(body: String, cookie: Cookie? = null, kakaoId: Long? = null) = mockMvc.post("/api/show-requests") {
		contentType = MediaType.APPLICATION_JSON
		content = body
		cookie?.let { cookie(it) }
		kakaoId?.let { with(oauth2Login().oauth2User(DefaultOAuth2User(listOf(SimpleGrantedAuthority("OAUTH2_USER")), mapOf("id" to it), "id"))) }
	}

	private fun devSession(): Cookie = mockMvc.post("/api/dev/login") {
		contentType = MediaType.APPLICATION_JSON
		content = """{"username":"dev","password":"correct-horse"}"""
	}.andReturn().response.getCookie("SESSION")!!

	@Test
	fun `비회원도 공연 추가를 요청할 수 있다`() {
		send("""{"kind":"CONCERT","name":"  어느 밴드 단독 공연  ","url":"https://example.com/ticket"}""").andExpect { status { isCreated() } }

		val saved = showRequestRepository.findAll().single()
		assertEquals("어느 밴드 단독 공연", saved.name)
		assertEquals(ShowKind.CONCERT, saved.kind)
		assertEquals(ShowRequestStatus.PENDING, saved.status)
		assertNull(saved.user)
	}

	@Test
	fun `로그인한 회원이 요청하면 누가 보냈는지 남긴다`() {
		send("""{"kind":"FESTIVAL","name":"어느 페스티벌","url":null}""", kakaoId = 1001).andExpect { status { isCreated() } }

		mockMvc.get("/api/dev/show-requests") { cookie(devSession()) }.andExpect {
			jsonPath("$.items[0].nickname") { value("노을빛") }
			jsonPath("$.items[0].member") { value(true) }
			jsonPath("$.counts.PENDING") { value(1) }
		}
	}

	@Test
	fun `이름이 비었거나 링크가 주소가 아니면 400`() {
		send("""{"kind":"FESTIVAL","name":"   ","url":null}""").andExpect { status { isBadRequest() } }
		send("""{"kind":"FESTIVAL","name":"${"가".repeat(101)}","url":null}""").andExpect { status { isBadRequest() } }
		send("""{"kind":"FESTIVAL","name":"어느 페스티벌","url":"javascript:alert(1)"}""").andExpect { status { isBadRequest() } }
		assertEquals(0, showRequestRepository.count())
	}

	@Test
	fun `같은 사람이 1분 안에 3개까지 보낼 수 있고 4번째는 429`() {
		val session = send("""{"kind":"FESTIVAL","name":"요청 1","url":null}""").andReturn().response.getCookie("SESSION")!!
		send("""{"kind":"FESTIVAL","name":"요청 2","url":null}""", session).andExpect { status { isCreated() } }
		send("""{"kind":"FESTIVAL","name":"요청 3","url":null}""", session).andExpect { status { isCreated() } }

		send("""{"kind":"FESTIVAL","name":"요청 4","url":null}""", session).andExpect { status { isTooManyRequests() } }
		assertEquals(3, showRequestRepository.count())
	}

	@Test
	fun `요청 목록은 개발자만 보고 처리할 수 있다`() {
		send("""{"kind":"CONCERT","name":"어느 공연","url":null}""")
		val id = showRequestRepository.findAll().single().id

		mockMvc.get("/api/dev/show-requests").andExpect { status { isUnauthorized() } }
		mockMvc.put("/api/dev/show-requests/$id") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"status":"DONE"}"""
		}.andExpect { status { isUnauthorized() } }

		val session = devSession()
		mockMvc.put("/api/dev/show-requests/$id") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"status":"DONE"}"""
			cookie(session)
		}.andExpect { status { isOk() } }
		mockMvc.get("/api/dev/show-requests?status=DONE") { cookie(session) }.andExpect {
			jsonPath("$.items[0].name") { value("어느 공연") }
			jsonPath("$.items[0].member") { value(false) }
			jsonPath("$.counts.PENDING") { value(0) }
		}
	}
}
