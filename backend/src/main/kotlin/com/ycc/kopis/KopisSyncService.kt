package com.ycc.kopis

import com.ycc.attendance.AttendanceRepository
import com.ycc.facility.Facility
import com.ycc.facility.FacilityRepository
import com.ycc.log.ShowLogRepository
import com.ycc.show.ShowRepository
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class KopisSyncService(
	private val kopisClient: KopisClient,
	private val showRepository: ShowRepository,
	private val facilityRepository: FacilityRepository,
	private val attendanceRepository: AttendanceRepository,
	private val logRepository: ShowLogRepository,
	private val clock: Clock,
) {

	fun sync(): Int {
		val today = LocalDate.now(clock)
		val summaries = generateSequence(today.minusMonths(PAST_MONTHS)) { it.plusDays(WINDOW_DAYS) }
			.takeWhile { it < today.plusMonths(FUTURE_MONTHS) }
			.flatMap { from -> REGIONS.asSequence().flatMap { fetchAllPages(from, from.plusDays(WINDOW_DAYS - 1), it) } }
			.distinctBy { it.kopisId }
			.toList()

		val details = summaries
			.filter { !it.openRun && !FAN_MEETING.containsMatchIn(it.name) }
			.filter { ChronoUnit.DAYS.between(it.startDate, it.endDate) < MAX_DURATION_DAYS }
			.mapNotNull { KopisParser.parseDetail(kopisClient.fetchDetail(it.kopisId)) }

		val facilities = details.mapNotNull { it.facilityId }.distinct().associateWith(::findOrFetchFacility)
		val shows = details.map { detail ->
			detail.toShow().apply { facility = detail.facilityId?.let(facilities::get) }
		}

		val keptIds = shows.map { it.kopisId }.toSet()
		showRepository.deleteAll(
			showRepository.findAll().filter {
				it.kopisId !in keptIds && it.endDate >= today &&
					!attendanceRepository.existsByShowId(it.id) && !logRepository.existsByShowId(it.id)
			},
		)
		shows.forEach { show ->
			showRepository.save(showRepository.findByKopisId(show.kopisId)?.apply { update(show) } ?: show)
		}
		return shows.size
	}

	private fun findOrFetchFacility(facilityId: String): Facility? =
		facilityRepository.findByKopisId(facilityId)
			?: KopisParser.parseFacility(kopisClient.fetchFacility(facilityId))?.let { facilityRepository.save(it.toFacility()) }

	private fun fetchAllPages(from: LocalDate, to: LocalDate, region: String): List<KopisSummary> {
		val summaries = mutableListOf<KopisSummary>()
		var page = 1
		do {
			val batch = KopisParser.parseList(kopisClient.fetchList(from, to, region, page++, ROWS))
			summaries += batch
		} while (batch.size == ROWS)
		return summaries
	}

	companion object {
		private const val ROWS = 100
		private const val PAST_MONTHS = 3L
		private const val FUTURE_MONTHS = 6L
		private const val WINDOW_DAYS = 31L
		private const val MAX_DURATION_DAYS = 31L
		private val REGIONS = listOf("11", "41")
		private val FAN_MEETING = Regex("팬미팅|FAN ?MEETING|MEET ?& ?GREET", RegexOption.IGNORE_CASE)
	}
}
