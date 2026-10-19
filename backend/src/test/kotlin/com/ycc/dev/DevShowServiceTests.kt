package com.ycc.dev

import com.ycc.show.ReviewStatus
import com.ycc.show.Show
import com.ycc.show.ShowKind
import com.ycc.show.ShowRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import java.time.LocalDate
import kotlin.test.assertEquals

@SpringBootTest
class DevShowServiceTests(
	@Autowired private val devShowService: DevShowService,
	@Autowired private val showRepository: ShowRepository,
) {

	private fun show(kopisId: String) = showRepository.save(
		Show(kopisId, "페스티벌 $kopisId", LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-01"), "공원", "http://example.com/p.jpg", null, null, null, null),
	)

	@BeforeEach
	fun clear() {
		showRepository.deleteAll()
	}

	@Test
	fun `새 공연은 대기이고, 여러 개를 한 번에 띄우거나 무시할 수 있다`() {
		val shows = listOf(show("PF1"), show("PF2"), show("PF3"))

		devShowService.review(ReviewRequest(shows.take(2).map { it.id }, ReviewStatus.VISIBLE))
		devShowService.review(ReviewRequest(listOf(shows[2].id), ReviewStatus.HIDDEN))

		val page = devShowService.shows(ReviewStatus.VISIBLE, ShowKind.FESTIVAL)
		assertEquals(listOf("PF1", "PF2"), page.items.map { it.show.name.removePrefix("페스티벌 ") })
		assertEquals(mapOf(ReviewStatus.PENDING to 0L, ReviewStatus.VISIBLE to 2L, ReviewStatus.HIDDEN to 1L), page.counts)
	}

	@Test
	fun `검수 목록은 지난 공연까지 전부 시작일 순으로 준다`() {
		showRepository.save(show("PF2").apply { startDate = LocalDate.parse("2026-12-01") })
		showRepository.save(show("PF1").apply { startDate = LocalDate.parse("2025-01-01") })

		val names = devShowService.shows(ReviewStatus.PENDING, ShowKind.FESTIVAL).items.map { it.kopisId }

		assertEquals(listOf("PF1", "PF2"), names)
	}
}
