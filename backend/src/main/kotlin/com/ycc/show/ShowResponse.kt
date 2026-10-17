package com.ycc.show

import java.time.LocalDate

data class ShowResponse(
	val id: Long,
	val name: String,
	val startDate: LocalDate,
	val endDate: LocalDate,
	val venue: String,
	val posterUrl: String,
	val ticketUrl: String?,
	val officialUrl: String?,
	val scheduleGuide: String?,
	val priceGuide: String?,
) {
	companion object {
		fun from(show: Show) = ShowResponse(
			id = show.id,
			name = show.name,
			startDate = show.startDate,
			endDate = show.endDate,
			venue = show.venue,
			posterUrl = show.posterUrl,
			ticketUrl = show.ticketUrl,
			officialUrl = show.officialUrl,
			scheduleGuide = show.scheduleGuide,
			priceGuide = show.priceGuide,
		)
	}
}
