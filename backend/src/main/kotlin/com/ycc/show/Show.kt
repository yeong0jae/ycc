package com.ycc.show

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDate

@Entity
@Table(name = "shows")
class Show(
	val kopisId: String,
	var name: String,
	var startDate: LocalDate,
	var endDate: LocalDate,
	var venue: String,
	var posterUrl: String,
	var ticketUrl: String?,
	var officialUrl: String?,
	var scheduleGuide: String?,
	var priceGuide: String?,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
) {
	fun update(other: Show) {
		name = other.name
		startDate = other.startDate
		endDate = other.endDate
		venue = other.venue
		posterUrl = other.posterUrl
		ticketUrl = other.ticketUrl
		officialUrl = other.officialUrl
		scheduleGuide = other.scheduleGuide
		priceGuide = other.priceGuide
	}
}
