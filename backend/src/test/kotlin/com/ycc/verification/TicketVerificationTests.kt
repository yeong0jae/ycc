package com.ycc.verification

import com.ycc.community.CommunityPostRepository
import com.ycc.dev.Developer
import com.ycc.dev.DeveloperRepository
import com.ycc.organizer.MutableClock
import com.ycc.show.ReviewStatus
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import com.ycc.suggestion.SuggestionRepository
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
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.time.Instant
import java.time.LocalDate
import javax.imageio.ImageIO
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class FakePrivacyFinder : PrivacyFinder {
	var fail = false

	override fun find(bytes: ByteArray, contentType: String): List<Box> {
		if (fail) error("AI 오류")
		return listOf(Box(0.4, 0.4, 0.2, 0.2))
	}
}

@SpringBootTest(properties = ["app.notice-images.dir=build/test-notice-images", "app.verification-images.dir=build/test-verification-images"])
@AutoConfigureMockMvc
class TicketVerificationTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val userRepository: UserRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val verificationRepository: TicketVerificationRepository,
	@Autowired private val suggestionRepository: SuggestionRepository,
	@Autowired private val postRepository: CommunityPostRepository,
	@Autowired private val developerRepository: DeveloperRepository,
	@Autowired private val storage: VerificationImageStorage,
	@Autowired private val finder: FakePrivacyFinder,
	@Autowired private val passwordEncoder: PasswordEncoder,
	@Autowired private val clock: MutableClock,
) {

	@TestConfiguration
	class Config {
		@Bean
		@Primary
		fun mutableClock() = MutableClock(BEFORE)

		@Bean
		@Primary
		fun fakePrivacyFinder() = FakePrivacyFinder()
	}

	private lateinit var show: Show
	private lateinit var other: Show
	private lateinit var dev: Cookie

	@BeforeEach
	@AfterEach
	fun clear() {
		suggestionRepository.deleteAll()
		postRepository.deleteAll()
		verificationRepository.deleteAll()
		userRepository.deleteAll()
		showRepository.deleteAll()
		developerRepository.deleteAll()
		clock.now = BEFORE
		finder.fail = false
	}

	@BeforeEach
	fun setUp() {
		fun make(id: String) = showRepository.save(
			Show(id, "공연 $id", LocalDate.parse("2026-10-24"), LocalDate.parse("2026-10-25"), "노들섬", "http://example.com/p.jpg", null, null, null, null, reviewStatus = ReviewStatus.VISIBLE, suggestionsEnabled = true),
		)
		show = make("PF1")
		other = make("PF2")
		listOf(1001L to "첫째", 2002L to "둘째").forEach { (id, nick) -> userRepository.save(User(id, nick)) }
		developerRepository.save(Developer("dev", passwordEncoder.encode("correct-horse")!!))
		dev = mockMvc.post("/api/dev/login") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"username":"dev","password":"correct-horse"}"""
		}.andReturn().response.getCookie("SESSION")!!
	}

	private fun MockHttpServletRequestDsl.member(kakaoId: Long) {
		with(oauth2Login().oauth2User(DefaultOAuth2User(listOf(SimpleGrantedAuthority("OAUTH2_USER")), mapOf("id" to kakaoId), "id")))
	}

	private fun MockHttpServletRequestDsl.json(body: String) {
		contentType = MediaType.APPLICATION_JSON
		content = body
	}

	private fun png(): ByteArray {
		val image = BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB)
		image.createGraphics().apply { color = Color.WHITE; fillRect(0, 0, 100, 100); dispose() }
		return ByteArrayOutputStream().also { ImageIO.write(image, "png", it) }.toByteArray()
	}

	private fun submit(kakaoId: Long, target: Show = show): ResultActionsDsl = mockMvc.multipart("/api/me/verifications/${target.id}") {
		file(MockMultipartFile("file", "ticket.png", "image/png", png()))
		member(kakaoId)
	}

	private fun verification() = verificationRepository.findAll().single()

	private fun decide(body: String) = mockMvc.put("/api/dev/verifications/${verification().id}") { cookie(dev); json(body) }

	private fun write(kakaoId: Long?, target: Show = show) = mockMvc.multipart("/api/shows/${target.id}/suggestions") {
		param("body", "입장 팔찌는 둘째 날도 받나요?")
		kakaoId?.let { member(it) }
	}

	@Test
	fun `회원만 캡처를 올리고, 올리면 확인 중`() {
		mockMvc.multipart("/api/me/verifications/${show.id}") { file(MockMultipartFile("file", "t.png", "image/png", png())) }
			.andExpect { status { isUnauthorized() } }
		mockMvc.multipart("/api/me/verifications/${show.id}") { member(1001) }.andExpect { status { isBadRequest() } }
		submit(1001).andExpect {
			status { isCreated() }
			jsonPath("$.status") { value("PENDING") }
		}
		submit(1001).andExpect { status { isConflict() } }
		mockMvc.get("/api/shows/${show.id}/suggestions") { member(1001) }.andExpect {
			jsonPath("$.write") { value("NO_PASS") }
			jsonPath("$.verification.status") { value("PENDING") }
		}
		write(1001).andExpect { status { isForbidden() } }
		mockMvc.get("/api/me/verifications") { member(1001) }.andExpect { jsonPath("$[0].showName") { value("공연 PF1") } }
	}

	@Test
	fun `저장되는 캡처는 가려져 있고, 처리하면 지워진다`() {
		submit(1001)
		val key = verification().imageKey!!
		val stored = ImageIO.read(ByteArrayInputStream(storage.read(key)))
		assertTrue(Color(stored.getRGB(50, 50)).red < 30)
		assertTrue(Color(stored.getRGB(5, 5)).red > 220)
		decide("""{"decision":"APPROVE"}""").andExpect { status { isOk() } }
		assertNull(verification().imageKey)
		assertFailsWith<Exception> { storage.read(key) }
	}

	@Test
	fun `가리기에 실패하면 저장하지 않는다`() {
		finder.fail = true
		submit(1001).andExpect { status { isServiceUnavailable() } }
		assertEquals(0, verificationRepository.count())
	}

	@Test
	fun `승인되면 현장 QR 없이 예매 인증 건의를 쓴다`() {
		submit(1001)
		decide("""{"decision":"APPROVE"}""")
		mockMvc.get("/api/shows/${show.id}/suggestions") { member(1001) }.andExpect {
			jsonPath("$.write") { value("OPEN") }
			jsonPath("$.writeSource") { value("TICKET") }
		}
		write(1001).andExpect {
			status { isCreated() }
			jsonPath("$.source") { value("TICKET") }
		}
		write(1001).andExpect { status { isTooManyRequests() } }
		write(1001, other).andExpect { status { isForbidden() } }
		write(2002).andExpect { status { isForbidden() } }
		mockMvc.get("/api/shows/${show.id}/suggestions").andExpect {
			jsonPath("$.items[0].source") { value("TICKET") }
			jsonPath("$.items[0].author") { doesNotExist() }
		}
	}

	@Test
	fun `공연이 끝나도 인증하고 쓸 수 있다`() {
		clock.now = Instant.parse("2026-12-01T03:00:00Z")
		submit(1001).andExpect { status { isCreated() } }
		decide("""{"decision":"APPROVE"}""")
		write(1001).andExpect { status { isCreated() } }
	}

	@Test
	fun `거절하면 사유가 보이고 다시 올린다, 승인은 취소할 수 있다`() {
		submit(1001)
		decide("""{"decision":"REJECT"}""").andExpect { status { isBadRequest() } }
		decide("""{"decision":"REJECT","reason":"NOT_VISIBLE"}""").andExpect { status { isOk() } }
		mockMvc.get("/api/shows/${show.id}/suggestions") { member(1001) }.andExpect {
			jsonPath("$.verification.status") { value("REJECTED") }
			jsonPath("$.verification.rejectReason") { value("NOT_VISIBLE") }
		}
		submit(1001).andExpect { jsonPath("$.status") { value("PENDING") } }
		decide("""{"decision":"APPROVE"}""")
		decide("""{"decision":"APPROVE"}""").andExpect { status { isConflict() } }
		decide("""{"decision":"REVOKE"}""").andExpect { status { isOk() } }
		write(1001).andExpect { status { isForbidden() } }
	}

	@Test
	fun `검수는 개발자만, 캡처도 개발자만 본다`() {
		submit(1001)
		val id = verification().id
		mockMvc.get("/api/dev/verifications").andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/dev/verifications/$id/image") { member(1001) }.andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/dev/verifications?status=PENDING") { cookie(dev) }.andExpect {
			jsonPath("$.pending") { value(1) }
			jsonPath("$.items[0].nickname") { value("첫째") }
			jsonPath("$.items[0].hasImage") { value(true) }
		}
		mockMvc.get("/api/dev/verifications/$id/image") { cookie(dev) }.andExpect {
			status { isOk() }
			content { contentType(MediaType.IMAGE_JPEG) }
		}
	}

	@Test
	fun `커뮤니티 글에 예매 인증 표시`() {
		submit(1001)
		decide("""{"decision":"APPROVE"}""")
		listOf(1001L, 2002L).forEach { id ->
			mockMvc.post("/api/shows/${show.id}/community") { member(id); json("""{"kind":"FREE","body":"안녕 $id"}""") }
			clock.now = clock.now.plusSeconds(61)
		}
		mockMvc.get("/api/shows/${show.id}/community").andExpect {
			jsonPath("$.items[0].authorVerified") { value(false) }
			jsonPath("$.items[1].authorVerified") { value(true) }
		}
	}

	@Test
	fun `탈퇴하면 인증과 캡처가 지워진다`() {
		submit(1001)
		val key = verification().imageKey!!
		mockMvc.delete("/api/me") { member(1001) }.andExpect { status { isOk() } }
		assertEquals(0, verificationRepository.count())
		assertFailsWith<Exception> { storage.read(key) }
	}

	companion object {
		private val BEFORE = Instant.parse("2026-10-21T03:00:00Z")
	}
}
