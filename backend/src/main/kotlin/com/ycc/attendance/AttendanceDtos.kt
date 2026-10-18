package com.ycc.attendance

import java.time.LocalDate

data class AttendanceResponse(val date: LocalDate, val status: AttendanceStatus)

data class SetAttendanceRequest(val status: AttendanceStatus)

data class AttendanceItem(
	val showId: Long,
	val showName: String,
	val posterUrl: String,
	val venue: String,
	val date: LocalDate,
	val status: AttendanceStatus,
	val logId: Long?,
)

data class HomeResponse(val upcoming: List<AttendanceItem>, val unrecorded: List<AttendanceItem>)

data class VenueCount(val name: String, val count: Int)

data class RecordStats(val thisYear: Int, val total: Int, val topVenue: VenueCount?)

data class YearRecords(val year: Int, val items: List<AttendanceItem>)

data class RecordsResponse(val stats: RecordStats, val years: List<YearRecords>)
