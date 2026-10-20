package com.ycc.community

import com.ycc.dev.Developer
import com.ycc.dev.DeveloperRepository
import com.ycc.organizer.MutableClock
import com.ycc.show.ReviewStatus
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import com.ycc.user.User
import com.ycc.user.UserRepository
import jakarta.servlet.http.Cookie
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login
import org.springframework.test.web.servlet.MockHttpServletRequestDsl
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.multipart
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import tools.jackson.databind.ObjectMapper
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.time.Instant
import java.time.LocalDate
import javax.imageio.ImageIO

@SpringBootTest(properties = ["app.notice-images.dir=build/test-notice-images"])
@AutoConfigureMockMvc
class CommunityTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val objectMapper: ObjectMapper,
	@Autowired private val userRepository: UserRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val postRepository: CommunityPostRepository,
	@Autowired private val reportRepository: CommunityReportRepository,
	@Autowired private val developerRepository: DeveloperRepository,
	@Autowired private val passwordEncoder: PasswordEncoder,
	@Autowired private val clock: MutableClock,
) {

	@TestConfiguration
	class ClockConfig {
		@Bean
		@Primary
		fun mutableClock() = MutableClock(Instant.parse("2026-10-24T05:00:00Z"))
	}

	private lateinit var show: Show

	@BeforeEach
	@AfterEach
	fun clear() {
		reportRepository.deleteAll()
		postRepository.deleteAll()
		userRepository.deleteAll()
		showRepository.deleteAll()
		developerRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		show = showRepository.save(
			Show("PF1", "공연", LocalDate.parse("2026-10-24"), LocalDate.parse("2026-10-25"), "노들섬", "http://example.com/p.jpg", null, null, null, null, reviewStatus = ReviewStatus.VISIBLE),
		)
		listOf(1001L to "첫째", 2002L to "둘째", 3003L to "셋째", 4004L to "넷째").forEach { (id, nick) -> userRepository.save(User(id, nick)) }
	}

	private fun MockHttpServletRequestDsl.json(body: String) {
		contentType = MediaType.APPLICATION_JSON
		content = body
	}

	private fun MockHttpServletRequestDsl.member(kakaoId: Long) {
		with(oauth2Login().oauth2User(DefaultOAuth2User(listOf(SimpleGrantedAuthority("OAUTH2_USER")), mapOf("id" to kakaoId), "id")))
	}

	private val base get() = "/api/shows/${show.id}/community"

	private fun write(kakaoId: Long, body: String = "입장 줄 어때요?", kind: String = "QUESTION", imageIds: String = ""): ResultActionsDsl =
		mockMvc.post(base) {
			member(kakaoId)
			json("""{"kind":"$kind","body":"$body","imageIds":[$imageIds]}""")
		}

	private fun postId(kakaoId: Long, body: String = "입장 줄 어때요?") =
		objectMapper.readTree(write(kakaoId, body).andReturn().response.contentAsString).get("id").asLong()

	private fun png(): ByteArray =
		ByteArrayOutputStream().also { ImageIO.write(BufferedImage(40, 30, BufferedImage.TYPE_INT_RGB), "png", it) }.toByteArray()

	@Test
	fun `누구나 보고, 회원만 쓴다`() {
		mockMvc.post(base) { json("""{"kind":"QUESTION","body":"안녕"}""") }.andExpect { status { isUnauthorized() } }
		val imageId = objectMapper.readTree(
			mockMvc.multipart("$base/images") {
				file(MockMultipartFile("file", "a.png", "image/png", png()))
				member(1001)
			}.andExpect { status { isCreated() } }.andReturn().response.contentAsString,
		).get("id").asLong()
		write(1001, "  사진 올려요  ", "REVIEW", "$imageId").andExpect {
			status { isCreated() }
			jsonPath("$.body") { value("사진 올려요") }
			jsonPath("$.author") { value("첫째") }
			jsonPath("$.images[0].width") { value(40) }
			jsonPath("$.mine") { value(true) }
		}
		mockMvc.get(base).andExpect {
			jsonPath("$.items.length()") { value(1) }
			jsonPath("$.items[0].mine") { value(false) }
		}
		mockMvc.get("$base?kind=QUESTION").andExpect { jsonPath("$.items.length()") { value(0) } }
	}

	@Test
	fun `내 글·댓글만 고치고 지운다`() {
		val id = postId(1001)
		mockMvc.put("$base/$id") { member(2002); json("""{"kind":"QUESTION","body":"남의 글"}""") }.andExpect { status { isForbidden() } }
		mockMvc.put("$base/$id") { member(1001); json("""{"kind":"TIP","body":"고친 글"}""") }.andExpect {
			jsonPath("$.kind") { value("TIP") }
			jsonPath("$.updatedAt") { exists() }
		}
		val commentId = objectMapper.readTree(
			mockMvc.post("$base/$id/comments") { member(2002); json("""{"body":"C 게이트요"}""") }.andReturn().response.contentAsString,
		).get("id").asLong()
		mockMvc.delete("$base/$id/comments/$commentId") { member(1001) }.andExpect { status { isForbidden() } }
		mockMvc.get("$base/$id") { member(1001) }.andExpect {
			jsonPath("$.post.commentCount") { value(1) }
			jsonPath("$.comments[0].mine") { value(false) }
			jsonPath("$.comments[0].byPostAuthor") { value(false) }
		}
		mockMvc.delete("$base/$id/comments/$commentId") { member(2002) }.andExpect { status { isOk() } }
		mockMvc.delete("$base/$id") { member(1001) }.andExpect { status { isOk() } }
		mockMvc.get("$base/$id").andExpect { status { isNotFound() } }
		mockMvc.get(base).andExpect { jsonPath("$.items.length()") { value(0) } }
	}

	@Test
	fun `좋아요는 한 번만, 다시 누르면 취소`() {
		val id = postId(1001)
		repeat(2) {
			mockMvc.put("$base/$id/like") { member(2002); json("""{"liked":true}""") }.andExpect { jsonPath("$.likeCount") { value(1) } }
		}
		mockMvc.get(base) { member(2002) }.andExpect { jsonPath("$.items[0].liked") { value(true) } }
		mockMvc.put("$base/$id/like") { member(2002); json("""{"liked":false}""") }.andExpect { jsonPath("$.likeCount") { value(0) } }
		mockMvc.put("$base/$id/like") { json("""{"liked":true}""") }.andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `신고가 3번 쌓이면 숨고, 같은 사람 신고는 한 번만, 개발자가 되돌린다`() {
		val id = postId(1001)
		repeat(2) { mockMvc.post("$base/$id/report") { member(2002); json("""{"reason":"SPAM"}""") } }
		mockMvc.post("$base/$id/report") { member(3003); json("""{"reason":"ABUSE"}""") }
		mockMvc.get(base).andExpect { jsonPath("$.items.length()") { value(1) } }
		mockMvc.post("$base/$id/report") { member(4004); json("""{"reason":"SPAM"}""") }
		mockMvc.get(base).andExpect { jsonPath("$.items.length()") { value(0) } }

		developerRepository.save(Developer("dev", passwordEncoder.encode("correct-horse")!!))
		val dev = mockMvc.post("/api/dev/login") { json("""{"username":"dev","password":"correct-horse"}""") }
			.andReturn().response.getCookie("SESSION")!!
		mockMvc.get("/api/dev/community/reports") { cookie(dev) }.andExpect {
			jsonPath("$[0].hidden") { value(true) }
			jsonPath("$[0].reasons.SPAM") { value(2) }
		}
		mockMvc.put("/api/dev/community/POST/$id/hidden") { cookie(dev); json("""{"hidden":false}""") }.andExpect { status { isOk() } }
		mockMvc.get(base).andExpect { jsonPath("$.items.length()") { value(1) } }
		mockMvc.get("/api/dev/community/reports") { cookie(dev) }.andExpect { jsonPath("$.length()") { value(0) } }
		mockMvc.get("/api/dev/community/reports") { cookie(Cookie("SESSION", "x")) }.andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `도배와 길이를 막는다`() {
		write(1001, " ").andExpect { status { isBadRequest() } }
		write(1001, "가".repeat(1001)).andExpect { status { isBadRequest() } }
		val id = postId(1001)
		write(1001).andExpect { status { isTooManyRequests() } }
		clock.now = clock.now.plusSeconds(61)
		write(1001).andExpect { status { isCreated() } }

		mockMvc.post("$base/$id/comments") { member(2002); json("""{"body":"하나"}""") }.andExpect { status { isCreated() } }
		mockMvc.post("$base/$id/comments") { member(2002); json("""{"body":"둘"}""") }.andExpect { status { isTooManyRequests() } }
		mockMvc.post("$base/$id/comments") { member(3003); json("""{"body":"${"가".repeat(301)}"}""") }.andExpect { status { isBadRequest() } }
	}
}
