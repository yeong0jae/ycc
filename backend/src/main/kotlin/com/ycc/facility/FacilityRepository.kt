package com.ycc.facility

import org.springframework.data.jpa.repository.JpaRepository

interface FacilityRepository : JpaRepository<Facility, Long> {
	fun findByKopisId(kopisId: String): Facility?
}
