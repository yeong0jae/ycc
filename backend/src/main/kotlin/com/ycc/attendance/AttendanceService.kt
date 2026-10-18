package com.ycc.attendance

import com.ycc.log.ShowLogRepository
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import com.ycc.user.User
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDate

@Service
@Transactional
class AttendanceService(
	private val attendanceRepository: AttendanceRepository,
	private val showRepository: ShowRepository,
	private val logRepository: ShowLogRepository,
	private val clock: Clock,
) {

	@Transactional(readOnly = true)
	fun mine(user: User, showId: Long): List<AttendanceResponse> =
		attendanceRepository.findByUserIdAndShowIdOrderByShowDate(user.id, showId).map { AttendanceResponse(it.showDate, it.status) }

	fun set(user: User, showId: Long, date: LocalDate, status: AttendanceStatus): List<AttendanceResponse> {
		val show = showRepository.findById(showId).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		if (date !in show.startDate..show.endDate) throw badRequest("공연 기간 안의 날짜를 골라 주세요.")
		if (status == AttendanceStatus.ATTENDED && date > today()) throw badRequest("공연 날부터 다녀옴을 남길 수 있어요.")
		upsert(user, show, date, status)
		return mine(user, showId)
	}

	fun delete(user: User, showId: Long, date: LocalDate): List<AttendanceResponse> {
		attendanceRepository.findByUserIdAndShowIdAndShowDate(user.id, showId, date)?.let(attendanceRepository::delete)
		return mine(user, showId)
	}

	fun markAttended(user: User, show: Show) {
		upsert(user, show, today().coerceIn(show.startDate, show.endDate), AttendanceStatus.ATTENDED)
	}

	@Transactional(readOnly = true)
	fun home(user: User): HomeResponse {
		val logs = logIds(user)
		val upcoming = attendanceRepository.findUpcoming(user.id, today()).map { it.toItem(logs) }
		val unrecorded = attendanceRepository.findPast(user.id, today())
			.filter { it.show.id !in logs }
			.distinctBy { it.show.id }
			.take(UNRECORDED_LIMIT)
			.map { it.toItem(logs) }
		return HomeResponse(upcoming, unrecorded)
	}

	@Transactional(readOnly = true)
	fun records(user: User): RecordsResponse {
		val logs = logIds(user)
		val attended = attendanceRepository.findAttended(user.id)
		val topVenue = attended.groupingBy { it.show.facility?.name ?: it.show.venue }.eachCount()
			.maxByOrNull { it.value }
			?.let { VenueCount(it.key, it.value) }
		val stats = RecordStats(
			thisYear = attended.count { it.showDate.year == today().year },
			total = attended.size,
			topVenue = topVenue,
		)
		val years = attended.groupBy { it.showDate.year }.map { (year, items) -> YearRecords(year, items.map { it.toItem(logs) }) }
		return RecordsResponse(stats, years)
	}

	private fun upsert(user: User, show: Show, date: LocalDate, status: AttendanceStatus) {
		val existing = attendanceRepository.findByUserIdAndShowIdAndShowDate(user.id, show.id, date)
		if (existing == null) attendanceRepository.save(Attendance(user, show, date, status))
		else existing.status = status
	}

	private fun logIds(user: User): Map<Long, Long> = logRepository.findReadyByUser(user.id).associate { it.show.id to it.id }

	private fun Attendance.toItem(logs: Map<Long, Long>) = AttendanceItem(
		showId = show.id,
		showName = show.name,
		posterUrl = show.posterUrl,
		venue = show.venue,
		date = showDate,
		status = status,
		logId = logs[show.id],
	)

	private fun today() = LocalDate.now(clock)

	private fun badRequest(message: String) = ResponseStatusException(HttpStatus.BAD_REQUEST, message)

	companion object {
		private const val UNRECORDED_LIMIT = 5
	}
}
