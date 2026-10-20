package com.ycc.timetable

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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.crypto.password.PasswordEncoder
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
import java.time.LocalDate
import java.time.LocalDateTime
import javax.imageio.ImageIO

@SpringBootTest(properties = ["app.notice-images.dir=build/test-notice-images"])
@AutoConfigureMockMvc
class TimetableTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val objectMapper: ObjectMapper,
	@Autowired private val organizerRepository: OrganizerRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val passwordEncoder: PasswordEncoder,
) {

	private lateinit var show: Show
	private lateinit var other: Show
	private lateinit var hostCookie: Cookie

	private fun show(kopisId: String) = showRepository.save(
		Show(kopisId, "공연 $kopisId", LocalDate.parse("2026-10-24"), LocalDate.parse("2026-10-25"), "노들섬", "http://example.com/p.jpg", null, null, null, null, reviewStatus = ReviewStatus.VISIBLE),
	)

	@BeforeEach
	@AfterEach
	fun clear() {
		organizerRepository.deleteAll()
		showRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		show = show("PF1")
		other = show("PF2")
		organizerRepository.save(Organizer("host", passwordEncoder.encode("organizer-pass")!!, "노들 운영팀", show, LocalDateTime.now()))
		organizerRepository.save(Organizer("other", passwordEncoder.encode("organizer-pass")!!, "다른 운영팀", other, LocalDateTime.now()))
		hostCookie = login("host")
	}

	private fun MockHttpServletRequestDsl.json(body: String) {
		contentType = MediaType.APPLICATION_JSON
		content = body
	}

	private fun login(username: String): Cookie = mockMvc.post("/api/organizer/login") {
		json("""{"username":"$username","password":"organizer-pass"}""")
	}.andReturn().response.getCookie("SESSION")!!

	private val base get() = "/api/organizer/shows/${show.id}/timetable"

	private fun send(method: String, path: String, body: String, cookie: Cookie = hostCookie): ResultActionsDsl {
		val dsl: MockHttpServletRequestDsl.() -> Unit = { json(body); cookie(cookie) }
		return when (method) {
			"POST" -> mockMvc.post(path, dsl = dsl)
			else -> mockMvc.put(path, dsl = dsl)
		}
	}

	private fun addStage(name: String): Long {
		val body = send("POST", "$base/stages", """{"name":"$name"}""").andReturn().response.contentAsString
		return objectMapper.readTree(body).get("stages").last().get("id").asLong()
	}

	private fun slot(stageId: Long, start: Int, end: Int, artist: String = "밴드 A", day: String = "2026-10-24") =
		"""{"stageId":$stageId,"day":"$day","start":$start,"end":$end,"artist":"$artist"}"""

	private fun png(): ByteArray =
		ByteArrayOutputStream().also { ImageIO.write(BufferedImage(60, 80, BufferedImage.TYPE_INT_RGB), "png", it) }.toByteArray()

	@Test
	fun `공개하기 전에는 관객에게 블록이 안 보이고, 공개하면 보인다`() {
		val main = addStage("메인 무대")
		send("POST", "$base/slots", slot(main, 840, 890, "밴드 C")).andExpect { status { isOk() } }
		send("POST", "$base/slots", slot(main, 1490, 1530, "심야 DJ")).andExpect { status { isOk() } }

		mockMvc.get("/api/shows/${show.id}/timetable").andExpect {
			jsonPath("$.published") { value(false) }
			jsonPath("$.days.length()") { value(2) }
			jsonPath("$.stages[0].name") { value("메인 무대") }
			jsonPath("$.slots.length()") { value(0) }
		}

		send("PUT", "$base/published", """{"published":true}""").andExpect { status { isOk() } }
		mockMvc.get("/api/shows/${show.id}/timetable").andExpect {
			jsonPath("$.slots.length()") { value(2) }
			jsonPath("$.slots[1].artist") { value("심야 DJ") }
			jsonPath("$.slots[1].end") { value(1530) }
		}
	}

	@Test
	fun `기간 밖 날짜, 시작이 끝보다 늦은 시간, 06시 넘는 끝, 빈 출연은 거절한다`() {
		val main = addStage("메인")
		send("POST", "$base/slots", slot(main, 600, 660, day = "2026-10-26")).andExpect { status { isBadRequest() } }
		send("POST", "$base/slots", slot(main, 700, 700)).andExpect { status { isBadRequest() } }
		send("POST", "$base/slots", slot(main, 1700, 1820)).andExpect { status { isBadRequest() } }
		send("POST", "$base/slots", slot(main, 600, 660, artist = "  ")).andExpect { status { isBadRequest() } }
		send("POST", "$base/stages", """{"name":" "}""").andExpect { status { isBadRequest() } }
	}

	@Test
	fun `다른 공연의 타임테이블은 고칠 수 없다`() {
		send("POST", "/api/organizer/shows/${other.id}/timetable/stages", """{"name":"남의 무대"}""").andExpect { status { isForbidden() } }
		val otherStage = objectMapper.readTree(
			send("POST", "/api/organizer/shows/${other.id}/timetable/stages", """{"name":"다른 무대"}""", login("other")).andReturn().response.contentAsString,
		).get("stages")[0].get("id").asLong()
		send("POST", "$base/slots", slot(otherStage, 600, 660)).andExpect { status { isBadRequest() } }
	}

	@Test
	fun `블록을 고치고 지우고, 무대를 지우면 그 무대 블록도 사라진다`() {
		val main = addStage("메인")
		val forest = addStage("숲")
		val slotId = objectMapper.readTree(send("POST", "$base/slots", slot(main, 720, 760)).andReturn().response.contentAsString)
			.get("slots")[0].get("id").asLong()
		send("POST", "$base/slots", slot(forest, 780, 820, "숲 밴드"))

		send("PUT", "$base/slots/$slotId", slot(forest, 730, 770, "옮긴 밴드")).andExpect {
			status { isOk() }
			jsonPath("$.slots[0].stageId") { value(forest) }
			jsonPath("$.slots[0].start") { value(730) }
		}
		send("PUT", "$base/stages/order", """{"stageIds":[$forest,$main]}""").andExpect { jsonPath("$.stages[0].name") { value("숲") } }

		mockMvc.delete("$base/stages/$forest") { cookie(hostCookie) }.andExpect {
			status { isOk() }
			jsonPath("$.stages.length()") { value(1) }
			jsonPath("$.slots.length()") { value(0) }
		}
	}

	@Test
	fun `공식 이미지는 올리면 바로 관객에게 보이고 지울 수 있다`() {
		val body = mockMvc.multipart("$base/images") {
			file(MockMultipartFile("file", "t.png", "image/png", png()))
			param("day", "2026-10-25")
			cookie(hostCookie)
		}.andExpect { status { isOk() } }.andReturn().response.contentAsString
		val imageId = objectMapper.readTree(body).get("images")[0].get("id").asLong()

		mockMvc.get("/api/shows/${show.id}/timetable").andExpect {
			jsonPath("$.published") { value(false) }
			jsonPath("$.images[0].day") { value("2026-10-25") }
			jsonPath("$.images[0].width") { value(60) }
		}
		mockMvc.multipart("$base/images") {
			file(MockMultipartFile("file", "t.png", "image/png", png()))
			param("day", "2026-11-01")
			cookie(hostCookie)
		}.andExpect { status { isBadRequest() } }

		mockMvc.delete("$base/images/$imageId") { cookie(hostCookie) }.andExpect { jsonPath("$.images.length()") { value(0) } }
	}
}
