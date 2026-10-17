package com.ycc.kopis

import org.junit.jupiter.api.Test
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class KopisParserTests {

	private fun fixture(name: String) = javaClass.getResource("/kopis/$name")!!.readText()

	@Test
	fun `목록에서 공연 ID와 이름, 기간, 오픈런 여부를 읽는다`() {
		val summaries = KopisParser.parseList(fixture("list.xml"))

		assertEquals(5, summaries.size)
		assertEquals(
			KopisSummary("PF000001", "테스트 밴드 내한공연", LocalDate.of(2026, 11, 7), LocalDate.of(2026, 11, 7), openRun = false),
			summaries[0],
		)
		assertTrue(summaries[3].openRun)
	}

	@Test
	fun `상세에서 기간과 첫 번째 예매처, 안내 문구를 읽는다`() {
		val detail = KopisParser.parseDetail(fixture("detail-PF000001.xml"))!!

		assertEquals(LocalDate.of(2026, 11, 7), detail.startDate)
		assertEquals("https://ticket.yes24.com/Perf/1", detail.ticketUrl)
		assertEquals("토요일(18:00)", detail.scheduleGuide)
		assertEquals("전석 110,000원", detail.priceGuide)
		assertFalse(detail.festival)
	}

	@Test
	fun `예매처가 없으면 예매 링크는 비어 있고 페스티벌 여부를 읽는다`() {
		val detail = KopisParser.parseDetail(fixture("detail-PF000004.xml"))!!

		assertNull(detail.ticketUrl)
		assertTrue(detail.festival)
	}
}
