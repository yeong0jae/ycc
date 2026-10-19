package com.ycc.organizer

import com.ycc.dev.Developer
import com.ycc.dev.DeveloperRepository
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
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.core.user.DefaultOAuth2User
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login
import org.springframework.test.web.servlet.MockHttpServletRequestDsl
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActionsDsl
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.time.Clock
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class MutableClock(var now: Instant) : Clock() {
	override fun getZone(): ZoneId = ZoneId.of("Asia/Seoul")

	override fun withZone(zone: ZoneId): Clock = this

	override fun instant(): Instant = now
}

@SpringBootTest
@AutoConfigureMockMvc
class OrganizerTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val organizerRepository: OrganizerRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val developerRepository: DeveloperRepository,
	@Autowired private val passwordEncoder: PasswordEncoder,
	@Autowired private val clock: MutableClock,
) {

	@TestConfiguration
	class ClockConfig {
		@Bean
		@Primary
		fun mutableClock() = MutableClock(Instant.parse("2026-10-18T03:00:00Z"))
	}

	private lateinit var show: Show
	private lateinit var other: Show

	private fun show(kopisId: String, status: ReviewStatus = ReviewStatus.VISIBLE) = showRepository.save(
		Show(kopisId, "공연 $kopisId", LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-01"), "공원", "http://example.com/p.jpg", null, null, null, null, reviewStatus = status),
	)

	@BeforeEach
	@AfterEach
	fun clear() {
		organizerRepository.deleteAll()
		developerRepository.deleteAll()
		showRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		show = show("PF1")
		other = show("PF2")
		developerRepository.save(Developer("dev", passwordEncoder.encode("correct-horse")!!))
	}

	private fun MockHttpServletRequestDsl.json(body: String) {
		contentType = MediaType.APPLICATION_JSON
		content = body
	}

	private fun devSession(): Cookie =
		mockMvc.post("/api/dev/login") { json("""{"username":"dev","password":"correct-horse"}""") }.andReturn().response.getCookie("SESSION")!!

	private fun create(dev: Cookie, username: String = "host", showId: Long = show.id): ResultActionsDsl =
		mockMvc.post("/api/dev/organizers") {
			json("""{"username":"$username","password":"organizer-pass","displayName":"주최사","showId":$showId}""")
			cookie(dev)
		}

	private fun login(password: String = "organizer-pass", username: String = "host") =
		mockMvc.post("/api/organizer/login") { json("""{"username":"$username","password":"$password"}""") }

	private fun organizerSession(): Cookie = login().andReturn().response.getCookie("SESSION")!!

	@Test
	fun `개발자가 만든 계정으로 로그인하면 그 공연만 볼 수 있다`() {
		create(devSession()).andExpect { status { isCreated() } }
		val session = organizerSession()

		mockMvc.get("/api/organizer/me") { cookie(session) }.andExpect {
			status { isOk() }
			jsonPath("$.displayName") { value("주최사") }
			jsonPath("$.showId") { value(show.id) }
		}
		mockMvc.get("/api/organizer/shows/${show.id}") { cookie(session) }.andExpect {
			status { isOk() }
			jsonPath("$.name") { value("공연 PF1") }
		}
		mockMvc.get("/api/organizer/shows/${other.id}") { cookie(session) }.andExpect { status { isForbidden() } }

		mockMvc.post("/api/organizer/logout") { cookie(session) }.andExpect { status { isOk() } }
		mockMvc.get("/api/organizer/me") { cookie(session) }.andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `카카오나 개발자 로그인으로는 주최측 API를 쓸 수 없다`() {
		val kakao = oauth2Login().oauth2User(DefaultOAuth2User(listOf(SimpleGrantedAuthority("OAUTH2_USER")), mapOf("id" to 1L), "id"))
		mockMvc.get("/api/organizer/me") { with(kakao) }.andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/organizer/me") { cookie(devSession()) }.andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `5번 틀리면 10분 동안 잠기고 그 뒤 풀린다`() {
		create(devSession())
		repeat(4) { login("wrong-pass").andExpect { status { isUnauthorized() } } }
		login("wrong-pass").andExpect { status { isTooManyRequests() } }
		login().andExpect { status { isTooManyRequests() } }

		clock.now = clock.now.plus(Duration.ofMinutes(10)).plusSeconds(1)
		login().andExpect { status { isOk() } }
		clock.now = Instant.parse("2026-10-18T03:00:00Z")
	}

	@Test
	fun `비활성화하면 로그인할 수 없고 이미 로그인한 세션도 끊긴다`() {
		val dev = devSession()
		create(dev)
		val session = organizerSession()
		val id = organizerRepository.findByUsername("host")!!.id

		mockMvc.put("/api/dev/organizers/$id/active") { json("""{"active":false}"""); cookie(dev) }.andExpect { status { isOk() } }
		mockMvc.get("/api/organizer/me") { cookie(session) }.andExpect { status { isUnauthorized() } }
		login().andExpect { status { isForbidden() } }

		mockMvc.put("/api/dev/organizers/$id/active") { json("""{"active":true}"""); cookie(dev) }
		login().andExpect { status { isOk() } }
	}

	@Test
	fun `한 공연에 계정은 하나, 띄움이 아닌 공연과 겹치는 아이디는 거절한다`() {
		val dev = devSession()
		create(dev)
		create(dev, username = "host2").andExpect { status { isConflict() } }
		create(dev, username = "host", showId = other.id).andExpect { status { isConflict() } }
		create(dev, username = "host3", showId = show("PF3", ReviewStatus.PENDING).id).andExpect { status { isBadRequest() } }
		create(dev, username = "Bad Name", showId = other.id).andExpect { status { isBadRequest() } }
	}

	@Test
	fun `개발자는 비밀번호와 공연을 바꾸고, 고를 수 있는 공연은 계정 없는 띄움 공연만 나온다`() {
		val dev = devSession()
		create(dev)
		val id = organizerRepository.findByUsername("host")!!.id

		mockMvc.get("/api/dev/organizers/shows?q=공연") { cookie(dev) }.andExpect {
			jsonPath("$.length()") { value(1) }
			jsonPath("$[0].id") { value(other.id) }
		}

		mockMvc.put("/api/dev/organizers/$id/password") { json("""{"password":"new-password"}"""); cookie(dev) }.andExpect { status { isOk() } }
		login().andExpect { status { isUnauthorized() } }
		login("new-password").andExpect { status { isOk() } }

		mockMvc.put("/api/dev/organizers/$id/show") { json("""{"showId":${other.id}}"""); cookie(dev) }.andExpect {
			status { isOk() }
			jsonPath("$.show.id") { value(other.id) }
		}
		mockMvc.get("/api/dev/organizers") { cookie(dev) }.andExpect {
			jsonPath("$[0].show.name") { value("공연 PF2") }
		}
	}

	@Test
	fun `주최측 관리 API는 개발자만`() {
		create(devSession())
		mockMvc.get("/api/dev/organizers").andExpect { status { isUnauthorized() } }
		mockMvc.get("/api/dev/organizers") { cookie(organizerSession()) }.andExpect { status { isUnauthorized() } }
	}
}
