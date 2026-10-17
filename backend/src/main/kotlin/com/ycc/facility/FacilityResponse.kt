package com.ycc.facility

import com.ycc.show.Show
import java.time.LocalDate

data class FacilityResponse(
	val id: Long,
	val name: String,
	val address: String?,
	val latitude: Double,
	val longitude: Double,
	val shows: List<FacilityShowResponse>,
)

data class FacilityShowResponse(
	val id: Long,
	val name: String,
	val startDate: LocalDate,
	val endDate: LocalDate,
	val posterUrl: String,
) {
	companion object {
		fun from(show: Show) = FacilityShowResponse(
			id = show.id,
			name = show.name,
			startDate = show.startDate,
			endDate = show.endDate,
			posterUrl = show.posterUrl,
		)
	}
}
