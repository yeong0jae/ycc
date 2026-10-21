package com.ycc.suggestion

import com.ycc.organizer.MutableClock
import com.ycc.organizer.Organizer
import com.ycc.organizer.OrganizerRepository
import com.ycc.show.ReviewStatus
import com.ycc.show.Show
import com.ycc.show.ShowRepository
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
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.multipart
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import tools.jackson.databind.ObjectMapper
import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import javax.imageio.ImageIO

@SpringBootTest(properties = ["app.notice-images.dir=build/test-notice-images"])
@AutoConfigureMockMvc
class SuggestionTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val objectMapper: ObjectMapper,
	@Autowired private val organizerRepository: OrganizerRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val suggestionRepository: SuggestionRepository,
	@Autowired private val sitePassRepository: SitePassRepository,
	@Autowired private val passwordEncoder: PasswordEncoder,
	@Autowired private val clock: MutableClock,
) {

	@TestConfiguration
	class ClockConfig {
		@Bean
		@Primary
		fun mutableClock() = MutableClock(DURING)
	}

	private lateinit var show: Show
	private lateinit var other: Show
	private lateinit var hostCookie: Cookie

	private fun show(kopisId: String) = showRepository.save(
		Show(kopisId, "공연 $kopisId", LocalDate.parse("2026-10-24"), LocalDate.parse("2026-10-25"), "노들섬", "http://example.com/p.jpg", null, null, null, null, reviewStatus = ReviewStatus.VISIBLE),
	)

	@BeforeEach
	@AfterEach
	fun clear() {
		suggestionRepository.deleteAll()
		sitePassRepository.deleteAll()
		organizerRepository.deleteAll()
		showRepository.deleteAll()
		clock.now = DURING
	}

	@BeforeEach
	fun setUp() {
		show = show("PF1")
		other = show("PF2")
		organizerRepository.save(Organizer("host", passwordEncoder.encode("organizer-pass")!!, "노들 운영팀", show, LocalDateTime.now()))
		organizerRepository.save(Organizer("other", passwordEncoder.encode("organizer-pass")!!, "다른 운영팀", other, LocalDateTime.now()))
		hostCookie = mockMvc.post("/api/organizer/login") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"username":"host","password":"organizer-pass"}"""
		}.andReturn().response.getCookie("SESSION")!!
	}

	private fun siteCode(showId: Long = show.id, cookie: Cookie = hostCookie): String =
		objectMapper.readTree(
			mockMvc.get("/api/organizer/shows/$showId/site-code") { cookie(cookie) }.andReturn().response.contentAsString,
		).get("code").asText()

	private fun scan(code: String, device: Cookie? = null): Cookie {
		val response = mockMvc.post("/api/site/$code") { device?.let { cookie(it) } }
			.andExpect { status { isOk() } }
			.andReturn().response
		return Cookie("ycc_device", response.getCookie("ycc_device")!!.value)
	}

	private fun write(device: Cookie?, body: String = "화장실 줄이 길어요", showId: Long = show.id): ResultActionsDsl =
		mockMvc.multipart("/api/shows/$showId/suggestions") {
			param("body", body)
			device?.let { cookie(it) }
		}

	private fun png(): ByteArray =
		ByteArrayOutputStream().also { ImageIO.write(BufferedImage(40, 30, BufferedImage.TYPE_INT_RGB), "png", it) }.toByteArray()

	@Test
	fun `현장 QR을 찍은 기기는 건의를 쓰고, 누구나 본다`() {
		val device = scan(siteCode())
		mockMvc.get("/api/shows/${show.id}/suggestions") { cookie(device) }.andExpect { jsonPath("$.write") { value("OPEN") } }

		mockMvc.multipart("/api/shows/${show.id}/suggestions") {
			param("body", "  우비 나눠 주세요  ")
			file(MockMultipartFile("file", "a.png", "image/png", png()))
			cookie(device)
		}.andExpect {
			status { isCreated() }
			jsonPath("$.source") { value("SITE_QR") }
			jsonPath("$.body") { value("우비 나눠 주세요") }
			jsonPath("$.image.width") { value(40) }
		}

		mockMvc.get("/api/shows/${show.id}/suggestions").andExpect {
			jsonPath("$.total") { value(1) }
			jsonPath("$.write") { value("NO_PASS") }
			jsonPath("$.items[0].body") { value("우비 나눠 주세요") }
		}
	}

	@Test
	fun `QR을 안 찍었거나 다른 공연 QR이면 쓸 수 없다`() {
		write(null).andExpect { status { isForbidden() } }
		val otherDevice = scan(siteCode(other.id, mockMvc.post("/api/organizer/login") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"username":"other","password":"organizer-pass"}"""
		}.andReturn().response.getCookie("SESSION")!!))
		write(otherDevice).andExpect { status { isForbidden() } }
		write(otherDevice, showId = other.id).andExpect { status { isCreated() } }
	}

	@Test
	fun `공연 전이든 끝난 뒤든 쓸 수 있다`() {
		val device = scan(siteCode())
		clock.now = Instant.parse("2026-10-20T00:00:00Z")
		write(device).andExpect { status { isCreated() } }
		clock.now = Instant.parse("2026-12-26T03:00:00Z")
		mockMvc.get("/api/shows/${show.id}/suggestions") { cookie(device) }.andExpect { jsonPath("$.write") { value("OPEN") } }
		write(device).andExpect { status { isCreated() } }
	}

	@Test
	fun `QR을 다시 만들면 예전 코드로는 못 들어온다`() {
		val old = siteCode()
		val fresh = objectMapper.readTree(
			mockMvc.post("/api/organizer/shows/${show.id}/site-code") { cookie(hostCookie) }.andReturn().response.contentAsString,
		).get("code").asText()
		mockMvc.post("/api/site/$old").andExpect { status { isNotFound() } }
		scan(fresh)
		mockMvc.get("/api/organizer/shows/${other.id}/site-code") { cookie(hostCookie) }.andExpect { status { isForbidden() } }
	}

	@Test
	fun `같은 기기는 1분에 하나, 하루 10개까지 쓰고, 길이를 넘으면 거절한다`() {
		val device = scan(siteCode())
		write(device, " ").andExpect { status { isBadRequest() } }
		write(device, "가".repeat(501)).andExpect { status { isBadRequest() } }
		write(device).andExpect { status { isCreated() } }
		write(device).andExpect { status { isTooManyRequests() } }
		repeat(9) {
			clock.now = clock.now.plusSeconds(61)
			write(device).andExpect { status { isCreated() } }
		}
		clock.now = clock.now.plusSeconds(61)
		write(device).andExpect { status { isTooManyRequests() } }
		write(scan(siteCode())).andExpect { status { isCreated() } }
	}

	@Test
	fun `주최측이 답하면 관객에게 보이고, 숨기면 사라진다`() {
		write(scan(siteCode())).andExpect { status { isCreated() } }
		val id = suggestionRepository.findAll().single().id
		val base = "/api/organizer/shows/${show.id}/suggestions/$id"

		mockMvc.put("$base/reply") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"body":"C 구역 화장실이 비어 있어요"}"""
			cookie(hostCookie)
		}.andExpect { jsonPath("$.reply.body") { value("C 구역 화장실이 비어 있어요") } }
		mockMvc.get("/api/shows/${show.id}/suggestions").andExpect { jsonPath("$.items[0].reply.body") { value("C 구역 화장실이 비어 있어요") } }

		mockMvc.put("$base/hidden") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"hidden":true}"""
			cookie(hostCookie)
		}.andExpect { jsonPath("$.hidden") { value(true) } }
		mockMvc.get("/api/shows/${show.id}/suggestions").andExpect { jsonPath("$.total") { value(0) } }
		mockMvc.get("/api/organizer/shows/${show.id}/suggestions") { cookie(hostCookie) }.andExpect { jsonPath("$[0].hidden") { value(true) } }

		mockMvc.put("/api/organizer/shows/${other.id}/suggestions/$id/hidden") {
			contentType = MediaType.APPLICATION_JSON
			content = """{"hidden":false}"""
			cookie(hostCookie)
		}.andExpect { status { isForbidden() } }
	}

	companion object {
		private val DURING = Instant.parse("2026-10-24T05:00:00Z")
	}
}
