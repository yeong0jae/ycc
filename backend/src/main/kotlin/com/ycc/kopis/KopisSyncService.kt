package com.ycc.kopis

import com.ycc.facility.Facility
import com.ycc.facility.FacilityRepository
import com.ycc.organizer.OrganizerRepository
import com.ycc.show.ReviewStatus
import com.ycc.show.ShowKind
import com.ycc.show.ShowRepository
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

data class SyncResult(val total: Int, val detailCount: Int, val full: Boolean)

@Service
class KopisSyncService(
	private val kopisClient: KopisClient,
	private val showRepository: ShowRepository,
	private val facilityRepository: FacilityRepository,
	private val syncRepository: KopisSyncRepository,
	private val organizerRepository: OrganizerRepository,
	private val clock: Clock,
) {

	fun sync(): SyncResult {
		val startedAt = LocalDateTime.now(clock)
		val today = startedAt.toLocalDate()
		val windows = generateSequence(today.minusMonths(PAST_MONTHS)) { it.plusDays(WINDOW_DAYS) }
			.takeWhile { it < today.plusMonths(FUTURE_MONTHS) }
			.toList()
		val lastSync = syncRepository.findTopByOrderByStartedAtDesc()
		val full = lastSync == null || showRepository.count() == 0L

		val festivals = windows.flatMap { from -> fetchAllPages { page -> kopisClient.fetchFestivals(from, end(from), page, ROWS) } }
		val festivalIds = festivals.map { it.kopisId }.toSet()
		val summaries = (festivals + windows.flatMap { from -> fetchAllPages { page -> kopisClient.fetchPerformances(from, end(from), page, ROWS) } })
			.distinctBy { it.kopisId }
			.filter(::isKept)
		val changedIds = if (full) emptySet() else windows
			.flatMap { from -> fetchAllPages { page -> kopisClient.fetchPerformances(from, end(from), page, ROWS, lastSync!!.startedAt.toLocalDate()) } }
			.map { it.kopisId }
			.toSet()

		val existing = showRepository.findAll().associateBy { it.kopisId }
		val toFetch = summaries.filter { full || it.kopisId !in existing || it.kopisId in changedIds }
		val details = toFetch
			.mapNotNull { KopisParser.parseDetail(kopisClient.fetchDetail(it.kopisId)) }
			.filter { it.area != OVERSEAS }
		val facilities = details.mapNotNull { it.facilityId }.distinct().associateWith(::findOrFetchFacility)

		details.forEach { detail ->
			val kind = if (detail.kopisId in festivalIds) ShowKind.FESTIVAL else ShowKind.CONCERT
			val show = detail.toShow().apply {
				facility = detail.facilityId?.let(facilities::get)
				this.kind = kind
			}
			val current = existing[detail.kopisId]
			if (current == null) {
				showRepository.save(show)
			} else {
				current.update(show)
				current.kind = kind
				showRepository.save(current)
			}
		}
		summaries.mapNotNull { existing[it.kopisId] }
			.filter { it.kind != kindOf(it.kopisId, festivalIds) }
			.forEach { showRepository.save(it.apply { kind = kindOf(kopisId, festivalIds) }) }

		val keptIds = summaries.map { it.kopisId }.toSet()
		val organizerShowIds = organizerRepository.findAllShowIds().toSet()
		showRepository.deleteAll(existing.values.filter { it.kopisId !in keptIds && it.endDate >= today && it.id !in organizerShowIds })
		syncRepository.save(KopisSync(startedAt, toFetch.size))
		return SyncResult(keptIds.size, toFetch.size, full)
	}

	private fun isKept(summary: KopisSummary) =
		!summary.openRun &&
			!FAN_MEETING.containsMatchIn(summary.name) &&
			!summary.name.startsWith(PACKAGE) &&
			ChronoUnit.DAYS.between(summary.startDate, summary.endDate) < MAX_DURATION_DAYS

	private fun kindOf(kopisId: String, festivalIds: Set<String>) =
		if (kopisId in festivalIds) ShowKind.FESTIVAL else ShowKind.CONCERT

	private fun end(from: LocalDate) = from.plusDays(WINDOW_DAYS - 1)

	private fun findOrFetchFacility(facilityId: String): Facility? =
		facilityRepository.findByKopisId(facilityId)
			?: KopisParser.parseFacility(kopisClient.fetchFacility(facilityId))?.let { facilityRepository.save(it.toFacility()) }

	private fun fetchAllPages(fetch: (Int) -> String): List<KopisSummary> {
		val summaries = mutableListOf<KopisSummary>()
		var page = 1
		do {
			val batch = KopisParser.parseList(fetch(page++))
			summaries += batch
		} while (batch.size == ROWS)
		return summaries
	}

	companion object {
		private const val ROWS = 100
		private const val PAST_MONTHS = 3L
		private const val FUTURE_MONTHS = 6L
		private const val WINDOW_DAYS = 31L
		private const val MAX_DURATION_DAYS = 14L
		private const val OVERSEAS = "해외"
		private const val PACKAGE = "[패키지]"
		private val FAN_MEETING = Regex("팬미팅|FAN ?MEETING|MEET ?& ?GREET", RegexOption.IGNORE_CASE)
	}
}
