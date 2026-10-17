package com.ycc.facility

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "facilities")
class Facility(
	val kopisId: String,
	val name: String,
	val address: String?,
	val latitude: Double?,
	val longitude: Double?,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)
