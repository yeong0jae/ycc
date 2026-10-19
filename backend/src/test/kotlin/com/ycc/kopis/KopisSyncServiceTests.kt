package com.ycc.kopis

import com.ycc.facility.FacilityRepository
import com.ycc.show.ReviewStatus
import com.ycc.show.ShowKind
import com.ycc.show.ShowRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import java.time.Clock
import java.time.LocalDate
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@SpringBootTest
class KopisSyncServiceTests(
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val facilityRepository: FacilityRepository,
	@Autowired private val syncRepository: KopisSyncRepository,
	@Autowired private val clock: Clock,
) {

	private var facilityCalls = 0
	private val detailCalls = mutableListOf<String>()
	private var changedIds = emptyList<String>()
	private var failDetail = false

	private fun fixture(name: String) = javaClass.getResource("/kopis/$name")!!.readText()

	private val fakeClient = object : KopisClient("test-key") {
		override fun fetchFestivals(from: LocalDate, to: LocalDate, page: Int, rows: Int) = fixture("list.xml")

		override fun fetchPerformances(from: LocalDate, to: LocalDate, page: Int, rows: Int, changedSince: LocalDate?): String {
			if (changedSince == null) return fixture("performances.xml")
			val rowsXml = changedIds.joinToString("") {
				"<db><mt20id>$it</mt20id><prfnm>바뀐 공연</prfnm><prfpdfrom>2026.11.14</prfpdfrom><prfpdto>2026.11.15</prfpdto><openrun>N</openrun></db>"
			}
			return "<dbs>$rowsXml</dbs>"
		}

		override fun fetchDetail(kopisId: String): String {
			if (failDetail) error("KOPIS 응답 없음")
			detailCalls += kopisId
			return fixture("detail-$kopisId.xml")
		}

		override fun fetchFacility(facilityId: String): String {
			facilityCalls++
			return fixture("facility-$facilityId.xml")
		}
	}

	private val syncService by lazy { KopisSyncService(fakeClient, showRepository, facilityRepository, syncRepository, clock) }

	@BeforeEach
	@AfterEach
	fun clear() {
		showRepository.deleteAll()
		facilityRepository.deleteAll()
		syncRepository.deleteAll()
	}

	@Test
	fun `팬미팅, 오픈런, 14일 넘는 공연, 패키지표, 해외 공연은 빼고 중복은 한 번만 저장한다`() {
		syncService.sync()

		assertEquals(listOf("PF000001", "PF000004", "PF000010"), showRepository.findAll().map { it.kopisId }.sorted())
	}

	@Test
	fun `축제 목록에 있으면 페스티벌, 공연 목록에만 있으면 콘서트로 저장하고 둘 다 대기로 시작한다`() {
		syncService.sync()

		val festival = showRepository.findByKopisId("PF000001")!!
		val concert = showRepository.findByKopisId("PF000010")!!
		assertEquals(ShowKind.FESTIVAL, festival.kind)
		assertEquals(ReviewStatus.PENDING, festival.reviewStatus)
		assertEquals(ShowKind.CONCERT, concert.kind)
		assertEquals(ReviewStatus.PENDING, concert.reviewStatus)
	}

	@Test
	fun `첫 동기화는 전체 상세를 받고, 다음부터는 새 공연과 바뀐 공연만 받는다`() {
		val first = syncService.sync()
		assertTrue(first.full)
		assertEquals(listOf("PF000001", "PF000004", "PF000007", "PF000010"), detailCalls.sorted())

		detailCalls.clear()
		val second = syncService.sync()
		assertFalse(second.full)
		assertEquals(listOf("PF000007"), detailCalls)

		detailCalls.clear()
		changedIds = listOf("PF000004")
		syncService.sync()
		assertEquals(listOf("PF000004", "PF000007"), detailCalls.sorted())
	}

	@Test
	fun `동기화가 실패하면 기록을 남기지 않아 다음에 다시 받는다`() {
		syncService.sync()
		failDetail = true
		changedIds = listOf("PF000004")

		assertThrows<IllegalStateException> { syncService.sync() }

		assertEquals(1, syncRepository.count())
	}

	@Test
	fun `공연에 공연장을 연결하고 이미 아는 공연장은 다시 조회하지 않는다`() {
		syncService.sync()
		syncService.sync()

		assertEquals(1, facilityCalls)
		assertEquals(37.5515788, facilityRepository.findByKopisId("FC000001")!!.latitude)
		val show = showRepository.findWithFacilityById(showRepository.findByKopisId("PF000001")!!.id)!!
		assertEquals("FC000001", show.facility!!.kopisId)
	}

	@Test
	fun `이번 동기화 결과에 없는 앞으로의 공연은 지우고 끝난 공연은 남긴다`() {
		val stale = KopisParser.parseDetail(fixture("detail-PF000004.xml"))!!
		showRepository.save(stale.copy(kopisId = "PF999999").toShow())
		val ended = LocalDate.now(clock).minusDays(10)
		showRepository.save(stale.copy(kopisId = "PF888888", startDate = ended, endDate = ended).toShow())

		syncService.sync()

		assertEquals(listOf("PF000001", "PF000004", "PF000010", "PF888888"), showRepository.findAll().map { it.kopisId }.sorted())
	}

	@Test
	fun `다시 동기화해도 종류와 검수 상태는 그대로 둔다`() {
		syncService.sync()
		showRepository.findByKopisId("PF000001")!!.let { showRepository.save(it.apply { reviewStatus = ReviewStatus.HIDDEN }) }
		changedIds = listOf("PF000001", "PF000010")

		syncService.sync()

		assertEquals(ReviewStatus.HIDDEN, showRepository.findByKopisId("PF000001")!!.reviewStatus)
		assertEquals(ShowKind.FESTIVAL, showRepository.findByKopisId("PF000001")!!.kind)
		assertEquals(ReviewStatus.PENDING, showRepository.findByKopisId("PF000010")!!.reviewStatus)
		assertEquals(3, showRepository.count())
	}
}
