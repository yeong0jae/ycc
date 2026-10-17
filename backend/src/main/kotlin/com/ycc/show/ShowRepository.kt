package com.ycc.show

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface ShowRepository : JpaRepository<Show, Long> {
	@Query("select s from Show s left join fetch s.facility where s.endDate >= :date order by s.startDate")
	fun findUpcoming(date: LocalDate): List<Show>

	@Query("select s from Show s left join fetch s.facility where s.id = :id")
	fun findWithFacilityById(id: Long): Show?

	fun findByKopisId(kopisId: String): Show?

	@Query("select s from Show s join fetch s.facility where s.endDate >= :date order by s.startDate")
	fun findUpcomingWithFacility(date: LocalDate): List<Show>
}
