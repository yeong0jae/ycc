package com.ycc.user

import com.ycc.show.ReviewStatus
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.multipart
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.time.LocalDate
import javax.imageio.ImageIO
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

@SpringBootTest(properties = ["app.notice-images.dir=build/test-notice-images"])
@AutoConfigureMockMvc
class MeControllerTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val userRepository: UserRepository,
	@Autowired private val participationRepository: ParticipationRepository,
	@Autowired private val showRepository: ShowRepository,
) {

	private lateinit var shows: List<Show>

	private fun loginAs(kakaoId: Long) =
		oauth2Login().oauth2User(DefaultOAuth2User(listOf(SimpleGrantedAuthority("OAUTH2_USER")), mapOf("id" to kakaoId), "id"))

	@BeforeEach
	@AfterEach
	fun clear() {
		participationRepository.deleteAll()
		userRepository.deleteAll()
		showRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		userRepository.save(User(kakaoId = 1001))
		userRepository.save(User(kakaoId = 2002, nickname = "노을빛"))
		shows = (1..3).map {
			showRepository.save(
				Show("PF$it", "공연 $it", LocalDate.parse("2026-11-0$it"), LocalDate.parse("2026-11-0$it"), "공원", "http://example.com/p.jpg", null, null, null, null, reviewStatus = ReviewStatus.VISIBLE),
			)
		}
	}

	private fun participate(kakaoId: Long, vararg ids: Long) = mockMvc.post("/api/me/participations") {
		with(loginAs(kakaoId))
		contentType = MediaType.APPLICATION_JSON
		content = """{"showIds":[${ids.joinToString(",")}]}"""
	}

	@Test
	fun `로그인하지 않으면 401`() {
		mockMvc.get("/api/me").andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/me/participations").andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `닉네임이 없던 회원은 처음 볼 때 겹치지 않는 랜덤 닉네임을 받는다`() {
		mockMvc.get("/api/me") { with(loginAs(1001)) }.andExpect { status { isOk() } }
		val nickname = userRepository.findByKakaoId(1001)!!.nickname!!
		assertTrue(nickname.length in 2..12 && nickname != "노을빛")
		mockMvc.get("/api/me") { with(loginAs(1001)) }.andExpect { jsonPath("$.nickname") { value(nickname) } }
	}

	@Test
	fun `닉네임을 바꾸고, 짧거나 남이 쓰면 거절한다`() {
		mockMvc.put("/api/me") {
			with(loginAs(1001))
			contentType = MediaType.APPLICATION_JSON
			content = """{"nickname": " 새벽세시 "}"""
		}.andExpect { jsonPath("$.nickname") { value("새벽세시") } }
		mockMvc.put("/api/me") {
			with(loginAs(1001))
			contentType = MediaType.APPLICATION_JSON
			content = """{"nickname": "a"}"""
		}.andExpect { status { isBadRequest() } }
		mockMvc.put("/api/me") {
			with(loginAs(1001))
			contentType = MediaType.APPLICATION_JSON
			content = """{"nickname": "노을빛"}"""
		}.andExpect { status { isConflict() } }
	}

	@Test
	fun `기기 참여를 합치면 겹치는 공연은 하나만, 계정에만 있던 공연은 그대로`() {
		val (a, b, c) = shows.map { it.id }
		participate(1001, a, b).andExpect { jsonPath("$.showIds.length()") { value(2) } }
		participate(1001, b, c, 999_999).andExpect { jsonPath("$.showIds.length()") { value(3) } }

		mockMvc.delete("/api/me/participations/$b") { with(loginAs(1001)) }.andExpect { jsonPath("$.showIds.length()") { value(2) } }
		mockMvc.get("/api/me/participations") { with(loginAs(2002)) }.andExpect { jsonPath("$.showIds.length()") { value(0) } }
	}

	@Test
	fun `탈퇴하면 계정과 참여가 지워진다`() {
		participate(1001, shows[0].id)
		mockMvc.delete("/api/me") { with(loginAs(1001)) }.andExpect { status { isOk() } }
		assertNull(userRepository.findByKakaoId(1001))
		assertEquals(0, participationRepository.count())
	}

	@Test
	fun `랜덤 닉네임을 다시 뽑을 수 있다`() {
		mockMvc.get("/api/me/random-nickname") { with(loginAs(1001)) }.andExpect { jsonPath("$.nickname") { exists() } }
	}

	@Test
	fun `프로필 사진을 올리고 지운다`() {
		val png = ByteArrayOutputStream().also { ImageIO.write(BufferedImage(20, 20, BufferedImage.TYPE_INT_RGB), "png", it) }.toByteArray()
		mockMvc.multipart(HttpMethod.PUT, "/api/me/avatar") {
			file(MockMultipartFile("file", "a.png", "image/png", png))
			with(loginAs(1001))
		}.andExpect { jsonPath("$.avatarUrl") { exists() } }
		mockMvc.get("/api/me") { with(loginAs(1001)) }.andExpect { jsonPath("$.avatarUrl") { isNotEmpty() } }
		mockMvc.delete("/api/me/avatar") { with(loginAs(1001)) }.andExpect { jsonPath("$.avatarUrl") { doesNotExist() } }
	}
}
