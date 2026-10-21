package com.ycc.map

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
import org.springframework.test.web.servlet.MockHttpServletRequestDsl
import org.springframework.test.web.servlet.MockMvc
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
import kotlin.test.assertEquals

@SpringBootTest(properties = ["app.notice-images.dir=build/test-notice-images"])
@AutoConfigureMockMvc
class MapTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val objectMapper: ObjectMapper,
	@Autowired private val organizerRepository: OrganizerRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val passwordEncoder: PasswordEncoder,
) {

	@TestConfiguration
	class FinderConfig {
		@Bean
		@Primary
		fun fakeFinder() = object : MapPinFinder {
			override val available = true

			override fun find(bytes: ByteArray, contentType: String) = FoundMap(
				Crop(0.0, 0.4, 1.0, 0.6),
				listOf(FoundPin(PinKind.STAGE, "MAIN STAGE", 0.8, 0.6), FoundPin(PinKind.RESTROOM, "화장실", 0.2, 0.8)),
			)
		}
	}

	private lateinit var show: Show
	private lateinit var other: Show
	private lateinit var host: Cookie

	@BeforeEach
	@AfterEach
	fun clear() {
		organizerRepository.deleteAll()
		showRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		fun make(id: String) = showRepository.save(
			Show(id, "공연 $id", LocalDate.parse("2026-10-24"), LocalDate.parse("2026-10-25"), "노들섬", "http://example.com/p.jpg", null, null, null, null, reviewStatus = ReviewStatus.VISIBLE),
		)
		show = make("PF1")
		other = make("PF2")
		organizerRepository.save(Organizer("host", passwordEncoder.encode("organizer-pass")!!, "운영팀", show, LocalDateTime.now()))
		host = mockMvc.post("/api/organizer/login") { json("""{"username":"host","password":"organizer-pass"}""") }.andReturn().response.getCookie("SESSION")!!
	}

	private fun MockHttpServletRequestDsl.json(body: String) {
		contentType = MediaType.APPLICATION_JSON
		content = body
	}

	private val base get() = "/api/organizer/shows/${show.id}/map"

	private fun png(): ByteArray =
		ByteArrayOutputStream().also { ImageIO.write(BufferedImage(100, 80, BufferedImage.TYPE_INT_RGB), "png", it) }.toByteArray()

	private fun upload() = mockMvc.multipart("$base/images") {
		file(MockMultipartFile("file", "m.png", "image/png", png()))
		cookie(host)
	}

	@Test
	fun `공식 이미지는 바로 보이고, AI 핀은 공개해야 보인다`() {
		mockMvc.post("/api/organizer/shows/${show.id}/timetable/stages") { cookie(host); json("""{"name":"Main"}""") }
		upload().andExpect { jsonPath("$.images[0].width") { value(100) } }
		mockMvc.post("$base/ai") { cookie(host) }.andExpect {
			jsonPath("$.pins.length()") { value(2) }
			jsonPath("$.pins[0].stageId") { exists() }
			jsonPath("$.pins[0].ai") { value(true) }
			jsonPath("$.pins[1].stageId") { doesNotExist() }
			jsonPath("$.images[0].crop.y") { value(0.4) }
		}
		mockMvc.get("/api/shows/${show.id}/map").andExpect {
			jsonPath("$.images.length()") { value(1) }
			jsonPath("$.pins.length()") { value(0) }
		}
		mockMvc.put("$base/published") { cookie(host); json("""{"published":true}""") }
		mockMvc.get("/api/shows/${show.id}/map").andExpect { jsonPath("$.pins.length()") { value(2) } }
	}

	@Test
	fun `핀을 더하고 고치고 지우고, 맵 밖이나 남의 공연은 거절한다`() {
		upload()
		val body = mockMvc.post("$base/pins") { cookie(host); json("""{"kind":"FOOD","name":" 푸드존 ","x":0.5,"y":0.5}""") }
			.andExpect { jsonPath("$.pins[0].name") { value("푸드존") } }.andReturn().response.contentAsString
		val pinId = objectMapper.readTree(body).get("pins")[0].get("id").asLong()
		mockMvc.put("$base/pins/$pinId") { cookie(host); json("""{"kind":"GOODS","name":"굿즈","description":"MD 판매","x":0.1,"y":0.9}""") }
			.andExpect {
				jsonPath("$.pins[0].kind") { value("GOODS") }
				jsonPath("$.pins[0].description") { value("MD 판매") }
			}
		mockMvc.post("$base/pins") { cookie(host); json("""{"kind":"FOOD","name":"밖","x":1.5,"y":0.5}""") }.andExpect { status { isBadRequest() } }
		mockMvc.post("/api/organizer/shows/${other.id}/map/pins") { cookie(host); json("""{"kind":"FOOD","name":"남의","x":0.5,"y":0.5}""") }
			.andExpect { status { isForbidden() } }
		mockMvc.delete("$base/pins/$pinId") { cookie(host) }.andExpect { jsonPath("$.pins.length()") { value(0) } }
	}

	@Test
	fun `이미지를 지우면 그 핀도 지워진다`() {
		val imageId = objectMapper.readTree(upload().andReturn().response.contentAsString).get("images")[0].get("id").asLong()
		mockMvc.post("$base/ai") { cookie(host) }
		mockMvc.delete("$base/images/$imageId") { cookie(host) }.andExpect {
			jsonPath("$.images.length()") { value(0) }
			jsonPath("$.pins.length()") { value(0) }
		}
	}

	@Test
	fun `Gemini 응답의 상자 좌표를 핀 위치로 바꾼다`() {
		val text = """{"map_area":[450,0,1000,1000],"places":[{"kind":"RESTROOM","name":"화장실","box_2d":[100,200,300,400]},{"kind":"WHAT","name":"기타 장소","box_2d":[0,0,1000,1000]},{"kind":"FOOD","name":"","box_2d":[1,2,3,4]}]}"""
		val response = objectMapper.writeValueAsString(mapOf("candidates" to listOf(mapOf("content" to mapOf("parts" to listOf(mapOf("text" to text)))))))
		val found = VertexMapPinFinder.parse(objectMapper, response)
		assertEquals(2, found.pins.size)
		assertEquals(PinKind.RESTROOM, found.pins[0].kind)
		assertEquals(0.3, found.pins[0].x, 1e-9)
		assertEquals(0.2, found.pins[0].y, 1e-9)
		assertEquals(PinKind.ETC, found.pins[1].kind)
		assertEquals(0.45, found.area!!.y, 1e-9)
		assertEquals(0.55, found.area!!.h, 1e-9)
	}

	@Test
	fun `보여 줄 범위를 고치고, 이미지 밖이면 거절한다`() {
		val imageId = objectMapper.readTree(upload().andReturn().response.contentAsString).get("images")[0].get("id").asLong()
		mockMvc.put("$base/images/$imageId/crop") { cookie(host); json("""{"x":0.1,"y":0.5,"w":0.8,"h":0.5}""") }
			.andExpect { jsonPath("$.images[0].crop.w") { value(0.8) } }
		mockMvc.put("$base/images/$imageId/crop") { cookie(host); json("""{"x":0.5,"y":0.5,"w":0.8,"h":0.5}""") }
			.andExpect { status { isBadRequest() } }
	}
}
