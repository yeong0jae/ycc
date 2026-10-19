package com.ycc.kopis

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class KopisParserTests {

	private fun fixture(name: String) = javaClass.getResource("/kopis/$name")!!.readText()

	@Test
	fun `목록에서 공연 ID와 이름, 기간, 오픈런 여부를 읽는다`() {
		val summaries = KopisParser.parseList(fixture("list.xml"))

		assertEquals(6, summaries.size)
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
		assertEquals("FC000001", detail.facilityId)
		assertEquals("서울특별시", detail.area)
	}

	@Test
	fun `예매처가 없으면 예매 링크는 비어 있다`() {
		val detail = KopisParser.parseDetail(fixture("detail-PF000004.xml"))!!

		assertNull(detail.ticketUrl)
	}

	@Test
	fun `시설에서 주소와 좌표를 읽는다`() {
		val facility = KopisParser.parseFacility(fixture("facility-FC000001.xml"))!!

		assertEquals("서울특별시 마포구 테스트로 1", facility.address)
		assertEquals(37.5515788, facility.latitude)
		assertEquals(126.9198284, facility.longitude)
	}

	@Test
	fun `KOPIS가 오류 코드를 돌려주면 코드와 메시지로 실패한다`() {
		val xml = """<dbs><db><returncode>02</returncode><errmsg>SERVICE KEY IS NOT REGISTERED ERROR</errmsg></db></dbs>"""

		val error = assertThrows<KopisApiException> { KopisParser.parseList(xml) }

		assertEquals("KOPIS 오류 02: SERVICE KEY IS NOT REGISTERED ERROR", error.message)
	}

	@Test
	fun `자료가 없다는 코드는 빈 목록으로 본다`() {
		val xml = """<dbs><db><returncode>04</returncode><errmsg>NODATA ERROR</errmsg></db></dbs>"""

		assertEquals(emptyList(), KopisParser.parseList(xml))
		assertNull(KopisParser.parseDetail(xml))
	}
}
