package com.ycc.kopis

import com.ycc.show.ShowRepository
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Service
class KopisSyncService(
	private val kopisClient: KopisClient,
	private val showRepository: ShowRepository,
	private val clock: Clock,
) {

	fun sync(): Int {
		val today = LocalDate.now(clock)
		val summaries = generateSequence(today) { it.plusDays(WINDOW_DAYS) }
			.takeWhile { it < today.plusMonths(MONTHS) }
			.flatMap { from -> REGIONS.asSequence().flatMap { fetchAllPages(from, from.plusDays(WINDOW_DAYS - 1), it) } }
			.distinctBy { it.kopisId }
			.toList()

		val shows = summaries
			.filter { !it.openRun && !FAN_MEETING.containsMatchIn(it.name) }
			.filter { ChronoUnit.DAYS.between(it.startDate, it.endDate) < MAX_DURATION_DAYS }
			.mapNotNull { KopisParser.parseDetail(kopisClient.fetchDetail(it.kopisId)) }
			.filterNot { it.festival }
			.map { it.toShow() }

		val keptIds = shows.map { it.kopisId }.toSet()
		showRepository.deleteAll(showRepository.findAll().filterNot { it.kopisId in keptIds })
		shows.forEach { show ->
			showRepository.save(showRepository.findByKopisId(show.kopisId)?.apply { update(show) } ?: show)
		}
		return shows.size
	}

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
		private const val MONTHS = 6L
		private const val WINDOW_DAYS = 31L
		private const val MAX_DURATION_DAYS = 31L
		private val REGIONS = listOf("11", "41")
		private val FAN_MEETING = Regex("팬미팅|FAN ?MEETING|MEET ?& ?GREET", RegexOption.IGNORE_CASE)
	}
}
