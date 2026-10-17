package com.ycc.festival

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import java.time.LocalDate

@Entity
class Festival(
	val name: String,
	val startDate: LocalDate,
	val endDate: LocalDate,
	val venue: String,
	val posterUrl: String,
	val lineup: String,
	val ticketUrl: String,
	val officialUrl: String,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)
