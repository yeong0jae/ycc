package com.ycc.festival

import java.time.LocalDate

data class FestivalResponse(
	val id: Long,
	val name: String,
	val startDate: LocalDate,
	val endDate: LocalDate,
	val venue: String,
	val posterUrl: String,
	val lineup: List<String>,
	val ticketUrl: String,
	val officialUrl: String,
) {
	companion object {
		fun from(festival: Festival) = FestivalResponse(
			id = festival.id,
			name = festival.name,
			startDate = festival.startDate,
			endDate = festival.endDate,
			venue = festival.venue,
			posterUrl = festival.posterUrl,
			lineup = festival.lineup.split(",").map { it.trim() },
			ticketUrl = festival.ticketUrl,
			officialUrl = festival.officialUrl,
		)
	}
}
