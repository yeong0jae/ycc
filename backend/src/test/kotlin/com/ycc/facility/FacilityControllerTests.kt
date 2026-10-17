package com.ycc.facility

import com.ycc.show.Show
import com.ycc.show.ShowRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@SpringBootTest
@AutoConfigureMockMvc
class FacilityControllerTests(
	@Autowired private val mockMvc: MockMvc,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val facilityRepository: FacilityRepository,
) {

	@TestConfiguration
	class FixedClockConfig {
		@Bean
		@Primary
		fun fixedClock(): Clock = Clock.fixed(Instant.parse("2026-10-18T03:00:00Z"), ZoneId.of("Asia/Seoul"))
	}

	private fun show(kopisId: String, date: String, facility: Facility?) = Show(
		kopisId = kopisId,
		name = "공연 $kopisId",
		startDate = LocalDate.parse(date),
		endDate = LocalDate.parse(date),
		venue = "테스트홀",
		posterUrl = "http://example.com/$kopisId.jpg",
		ticketUrl = null,
		officialUrl = null,
		scheduleGuide = null,
		priceGuide = null,
		facility = facility,
	)

	@BeforeEach
	fun setUp() {
		showRepository.deleteAll()
		facilityRepository.deleteAll()
		val hall = facilityRepository.save(Facility("FC1", "테스트홀", "서울 마포구", 37.55, 126.92))
		val noCoords = facilityRepository.save(Facility("FC2", "좌표 없는 홀", null, null, null))
		showRepository.saveAll(
			listOf(
				show("PF1", "2026-11-01", hall),
				show("PF2", "2026-10-25", hall),
				show("PF3", "2026-10-01", hall),
				show("PF4", "2026-10-30", noCoords),
				show("PF5", "2026-10-30", null),
			),
		)
	}

	@Test
	fun `좌표가 있는 공연장별로 다가오는 공연을 묶어 준다`() {
		mockMvc.get("/api/facilities").andExpect {
			status { isOk() }
			jsonPath("$.length()") { value(1) }
			jsonPath("$[0].name") { value("테스트홀") }
			jsonPath("$[0].latitude") { value(37.55) }
			jsonPath("$[0].shows.length()") { value(2) }
			jsonPath("$[0].shows[0].name") { value("공연 PF2") }
		}
	}
}
