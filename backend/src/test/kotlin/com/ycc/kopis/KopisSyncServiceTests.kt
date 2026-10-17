package com.ycc.kopis

import com.ycc.facility.FacilityRepository
import com.ycc.show.ShowRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import java.time.Clock
import java.time.LocalDate
import kotlin.test.assertEquals

@SpringBootTest
class KopisSyncServiceTests(
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val facilityRepository: FacilityRepository,
	@Autowired private val clock: Clock,
) {

	private val fakeClient = object : KopisClient("test-key") {
		override fun fetchList(from: LocalDate, to: LocalDate, region: String, page: Int, rows: Int) =
			if (region == "11") javaClass.getResource("/kopis/list.xml")!!.readText() else "<dbs></dbs>"

		override fun fetchDetail(kopisId: String) =
			javaClass.getResource("/kopis/detail-$kopisId.xml")!!.readText()

		override fun fetchFacility(facilityId: String): String {
			facilityCalls++
			return javaClass.getResource("/kopis/facility-$facilityId.xml")!!.readText()
		}
	}

	private var facilityCalls = 0

	private val syncService by lazy { KopisSyncService(fakeClient, showRepository, facilityRepository, clock) }

	@BeforeEach
	fun clear() {
		showRepository.deleteAll()
		facilityRepository.deleteAll()
	}

	@Test
	fun `팬미팅, 페스티벌, 오픈런, 31일 넘는 공연은 빼고 중복은 한 번만 저장한다`() {
		syncService.sync()

		assertEquals(listOf("PF000001"), showRepository.findAll().map { it.kopisId })
	}

	@Test
	fun `공연에 공연장을 연결하고 이미 아는 공연장은 다시 조회하지 않는다`() {
		syncService.sync()
		syncService.sync()

		assertEquals(1, facilityCalls)
		assertEquals(37.5515788, facilityRepository.findByKopisId("FC000001")!!.latitude)
		assertEquals(1, showRepository.findUpcomingWithFacility(LocalDate.of(2026, 10, 18)).size)
	}

	@Test
	fun `이번 동기화 결과에 없는 공연은 지운다`() {
		showRepository.save(KopisParser.parseDetail(javaClass.getResource("/kopis/detail-PF000004.xml")!!.readText())!!.toShow())

		syncService.sync()

		assertEquals(listOf("PF000001"), showRepository.findAll().map { it.kopisId })
	}

	@Test
	fun `다시 동기화하면 새로 넣지 않고 갱신한다`() {
		syncService.sync()
		syncService.sync()

		assertEquals(1, showRepository.count())
		assertEquals("테스트 밴드 내한공연", showRepository.findByKopisId("PF000001")!!.name)
	}
}
