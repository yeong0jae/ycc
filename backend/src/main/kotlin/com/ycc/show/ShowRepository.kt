package com.ycc.show

import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Slice
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface ShowRepository : JpaRepository<Show, Long> {
	@Query("select s from Show s left join fetch s.facility where s.startDate <= :today and s.endDate >= :today and (:pattern is null or lower(s.name) like :pattern) order by s.endDate, s.id")
	fun searchOngoing(today: LocalDate, pattern: String?, pageable: Pageable): Slice<Show>

	@Query("select s from Show s left join fetch s.facility where s.startDate > :today and (:pattern is null or lower(s.name) like :pattern) order by s.startDate, s.id")
	fun searchUpcoming(today: LocalDate, pattern: String?, pageable: Pageable): Slice<Show>

	@Query("select s from Show s left join fetch s.facility where s.endDate < :today and (:pattern is null or lower(s.name) like :pattern) order by s.startDate desc, s.id desc")
	fun searchPast(today: LocalDate, pattern: String?, pageable: Pageable): Slice<Show>

	@Query("select s from Show s left join fetch s.facility where s.id = :id")
	fun findWithFacilityById(id: Long): Show?

	fun findByKopisId(kopisId: String): Show?

	@Query("select s from Show s join fetch s.facility where s.endDate >= :date order by s.startDate")
	fun findUpcomingWithFacility(date: LocalDate): List<Show>
}
