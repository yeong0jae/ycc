package com.ycc.log

import com.ycc.show.Show
import java.time.LocalDate

data class ClipResponse(val moment: Moment, val durationMs: Int)

data class MyLogResponse(
	val id: Long,
	val status: LogStatus,
	val clips: List<ClipResponse>,
	val song: String?,
	val note: String?,
	val visibility: Visibility,
)

data class LogResponse(
	val id: Long,
	val userId: Long,
	val nickname: String?,
	val showId: Long,
	val showName: String,
	val showStartDate: LocalDate,
	val song: String?,
	val note: String?,
	val visibility: Visibility,
	val cutCount: Int,
	val videoUrl: String,
	val thumbnailUrl: String,
)

data class ShowMeResponse(val planned: Boolean, val log: MyLogResponse?)

data class PublishLogRequest(val song: String?, val note: String?, val visibility: Visibility)

data class FeedShow(val id: Long, val name: String, val startDate: LocalDate, val endDate: LocalDate, val venue: String) {
	companion object {
		fun from(show: Show) = FeedShow(show.id, show.name, show.startDate, show.endDate, show.venue)
	}
}

data class FeedPerson(
	val userId: Long,
	val nickname: String?,
	val log: LogResponse?,
	val wasThereSent: Boolean,
	val nextTogetherSent: Boolean,
	val nextTogetherMatched: Boolean,
)

data class PastFeedItem(val show: FeedShow, val myLogId: Long, val people: List<FeedPerson>)

data class NextFeedItem(val show: FeedShow, val people: List<FeedPerson>)

data class UserProfileResponse(val id: Long, val nickname: String?, val logCount: Int)
