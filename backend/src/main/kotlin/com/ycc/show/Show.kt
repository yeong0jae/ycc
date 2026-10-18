package com.ycc.show

import com.ycc.facility.Facility
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDate

enum class ReviewStatus { PENDING, VISIBLE, HIDDEN }

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
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "facility_id")
	var facility: Facility? = null,
	@Enumerated(EnumType.STRING)
	var reviewStatus: ReviewStatus = ReviewStatus.PENDING,
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
		facility = other.facility
	}
}
