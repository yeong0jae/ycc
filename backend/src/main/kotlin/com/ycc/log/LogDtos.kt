package com.ycc.log

import com.ycc.attendance.AttendanceResponse
import java.time.LocalDate

data class ClipResponse(val moment: Moment, val durationMs: Int)

data class MyLogResponse(
	val id: Long,
	val status: LogStatus,
	val clips: List<ClipResponse>,
	val song: String?,
	val note: String?,
)

data class LogResponse(
	val id: Long,
	val showId: Long,
	val showName: String,
	val showStartDate: LocalDate,
	val song: String?,
	val note: String?,
	val cutCount: Int,
	val videoUrl: String,
	val thumbnailUrl: String,
)

data class ShowMeResponse(val attendances: List<AttendanceResponse>, val log: MyLogResponse?)

data class PublishLogRequest(val song: String?, val note: String?)
