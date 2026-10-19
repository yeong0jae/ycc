package com.ycc.notice

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
class NoticeTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val objectMapper: ObjectMapper,
	@Autowired private val noticeRepository: NoticeRepository,
	@Autowired private val noticeImageRepository: NoticeImageRepository,
	@Autowired private val organizerRepository: OrganizerRepository,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val passwordEncoder: PasswordEncoder,
	@Autowired private val noticeService: NoticeService,
) {

	private lateinit var show: Show
	private lateinit var other: Show

	private fun show(kopisId: String, status: ReviewStatus = ReviewStatus.VISIBLE) = showRepository.save(
		Show(kopisId, "공연 $kopisId", LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-01"), "공원", "http://example.com/p.jpg", null, null, null, null, reviewStatus = status),
	)

	@BeforeEach
	@AfterEach
	fun clear() {
		noticeImageRepository.deleteAll()
		noticeRepository.deleteAll()
		organizerRepository.deleteAll()
		showRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		show = show("PF1")
		other = show("PF2")
		organizerRepository.save(Organizer("host", passwordEncoder.encode("organizer-pass")!!, "노들 운영팀", show, LocalDateTime.now()))
		organizerRepository.save(Organizer("other", passwordEncoder.encode("organizer-pass")!!, "다른 운영팀", other, LocalDateTime.now()))
	}

	private fun MockHttpServletRequestDsl.json(body: String) {
		contentType = MediaType.APPLICATION_JSON
		content = body
	}

	private fun login(username: String = "host"): Cookie = mockMvc.post("/api/organizer/login") {
		json("""{"username":"$username","password":"organizer-pass"}""")
	}.andReturn().response.getCookie("SESSION")!!

	private fun post(session: Cookie, body: String, showId: Long = show.id) = mockMvc.post("/api/organizer/shows/$showId/notices") {
		json(body)
		cookie(session)
	}

	private fun png(width: Int = 40, height: Int = 30): ByteArray =
		ByteArrayOutputStream().also { ImageIO.write(BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", it) }.toByteArray()

	private fun upload(session: Cookie, bytes: ByteArray = png(), type: String = "image/png"): Long {
		val result = mockMvc.multipart("/api/organizer/shows/${show.id}/notice-images") {
			file(MockMultipartFile("file", "a.png", type, bytes))
			cookie(session)
		}.andExpect { status { isCreated() } }.andReturn()
		return objectMapper.readTree(result.response.contentAsString).get("id").asLong()
	}

	@Test
	fun `주최측이 올린 공지를 로그인 없이 볼 수 있고, 최근 긴급 공지는 따로 맨 위에 준다`() {
		val session = login()
		post(session, """{"kind":"INFO","title":"입장 안내","body":"11시부터 입장해요.\n우비를 챙겨 주세요."}""").andExpect { status { isCreated() } }
		post(session, """{"kind":"URGENT","title":"우천으로 잠시 멈춰요","body":"15:30에 다시 알려 드릴게요."}""")
		post(session, """{"kind":"SCHEDULE","title":"30분 늦게 시작해요","body":"14:00에 시작해요."}""")

		mockMvc.get("/api/shows/${show.id}/notices").andExpect {
			status { isOk() }
			jsonPath("$.total") { value(3) }
			jsonPath("$.urgent.title") { value("우천으로 잠시 멈춰요") }
			jsonPath("$.urgent.organizerName") { value("노들 운영팀") }
			jsonPath("$.items.length()") { value(2) }
			jsonPath("$.items[0].title") { value("30분 늦게 시작해요") }
			jsonPath("$.items[1].body") { value("11시부터 입장해요.\n우비를 챙겨 주세요.") }
		}
	}

	@Test
	fun `글 없이 이미지만 있는 공지도 올릴 수 있고, 내용도 이미지도 없으면 거절한다`() {
		val session = login()
		val imageId = upload(session, png(800, 1000))

		post(session, """{"kind":"URGENT","title":"공연 취소 안내","body":null,"imageIds":[$imageId]}""").andExpect {
			status { isCreated() }
			jsonPath("$.images[0].width") { value(800) }
			jsonPath("$.images[0].height") { value(1000) }
		}
		post(session, """{"kind":"INFO","title":"제목만","body":"  "}""").andExpect { status { isBadRequest() } }
		post(session, """{"kind":"INFO","title":"${"가".repeat(61)}","body":"내용"}""").andExpect { status { isBadRequest() } }
	}

	@Test
	fun `이미지가 아니거나 다른 형식이면 거절한다`() {
		val session = login()
		mockMvc.multipart("/api/organizer/shows/${show.id}/notice-images") {
			file(MockMultipartFile("file", "a.png", "image/png", "not an image".toByteArray()))
			cookie(session)
		}.andExpect { status { isBadRequest() } }
		mockMvc.multipart("/api/organizer/shows/${show.id}/notice-images") {
			file(MockMultipartFile("file", "a.gif", "image/gif", png()))
			cookie(session)
		}.andExpect { status { isBadRequest() } }
	}

	@Test
	fun `고치면 수정 시각이 남고, 지우면 관객 화면에서 사라진다`() {
		val session = login()
		val id = objectMapper.readTree(
			post(session, """{"kind":"INFO","title":"입장 안내","body":"11시"}""").andReturn().response.contentAsString,
		).get("id").asLong()

		mockMvc.put("/api/organizer/shows/${show.id}/notices/$id") {
			json("""{"kind":"SCHEDULE","title":"입장 시간 변경","body":"12시"}""")
			cookie(session)
		}.andExpect {
			status { isOk() }
			jsonPath("$.updatedAt") { exists() }
		}
		mockMvc.get("/api/shows/${show.id}/notices").andExpect { jsonPath("$.items[0].title") { value("입장 시간 변경") } }

		mockMvc.delete("/api/organizer/shows/${show.id}/notices/$id") { cookie(session) }.andExpect { status { isOk() } }
		mockMvc.get("/api/shows/${show.id}/notices").andExpect { jsonPath("$.total") { value(0) } }
	}

	@Test
	fun `다른 공연의 공지는 쓰거나 고칠 수 없다`() {
		val mine = login()
		post(mine, """{"kind":"INFO","title":"남의 공연","body":"내용"}""", showId = other.id).andExpect { status { isForbidden() } }

		val id = objectMapper.readTree(
			post(login("other"), """{"kind":"INFO","title":"다른 공연 공지","body":"내용"}""", showId = other.id).andReturn().response.contentAsString,
		).get("id").asLong()
		mockMvc.put("/api/organizer/shows/${show.id}/notices/$id") {
			json("""{"kind":"INFO","title":"바꿈","body":"내용"}""")
			cookie(mine)
		}.andExpect { status { isNotFound() } }
		mockMvc.post("/api/organizer/shows/${show.id}/notices") { json("""{"kind":"INFO","title":"로그인 없이","body":"내용"}""") }
			.andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `다른 주최측이 올린 이미지는 붙일 수 없다`() {
		val imageId = upload(login())

		post(login("other"), """{"kind":"INFO","title":"남의 이미지","body":null,"imageIds":[$imageId]}""", showId = other.id)
			.andExpect { status { isBadRequest() } }
	}

	@Test
	fun `참여한 공연을 한 번에 받고, 띄움이 아닌 공연은 빠진다`() {
		val hidden = show("PF3", ReviewStatus.HIDDEN)
		post(login(), """{"kind":"URGENT","title":"우천 중단","body":"잠시 멈춰요"}""")

		mockMvc.get("/api/shows/participated?ids=${show.id},${other.id},${hidden.id}").andExpect {
			jsonPath("$.length()") { value(2) }
			jsonPath("$[0].show.id") { value(show.id) }
			jsonPath("$[0].latestNotice.title") { value("우천 중단") }
			jsonPath("$[0].noticeCount") { value(1) }
			jsonPath("$[1].latestNotice") { doesNotExist() }
		}
	}

	@Test
	fun `공지에 붙지 않고 하루 지난 이미지는 지운다`() {
		val session = login()
		val stale = upload(session)
		val attached = upload(session)
		post(session, """{"kind":"INFO","title":"이미지 공지","body":null,"imageIds":[$attached]}""")
		noticeImageRepository.findById(stale).get().let {
			noticeImageRepository.save(NoticeImage(it.show, it.organizer, it.storageKey, it.url, it.width, it.height, LocalDateTime.now().minusDays(2)))
			noticeImageRepository.delete(it)
		}

		noticeService.deleteUnattachedImages()

		assertEquals(listOf(attached), noticeImageRepository.findAll().map { it.id })
	}
}
