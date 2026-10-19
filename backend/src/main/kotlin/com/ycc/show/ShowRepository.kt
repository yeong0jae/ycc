package com.ycc.show

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface ShowRepository : JpaRepository<Show, Long> {
	@Query("select s from Show s left join fetch s.facility where s.reviewStatus = com.ycc.show.ReviewStatus.VISIBLE and s.kind = :kind and (:pattern is null or lower(s.name) like :pattern or lower(s.castText) like :pattern) order by s.startDate, s.id")
	fun searchVisible(kind: ShowKind, pattern: String?): List<Show>

	@Query("select s from Show s left join fetch s.facility where s.id = :id")
	fun findWithFacilityById(id: Long): Show?

	fun findByKopisId(kopisId: String): Show?

	@Query("select s from Show s join fetch s.facility where s.reviewStatus = com.ycc.show.ReviewStatus.VISIBLE and s.kind = :kind and s.endDate >= :date order by s.startDate")
	fun findUpcomingWithFacility(date: LocalDate, kind: ShowKind): List<Show>

	fun findByReviewStatusAndKindOrderByStartDateAscIdAsc(status: ReviewStatus, kind: ShowKind): List<Show>

	fun countByReviewStatusAndKind(status: ReviewStatus, kind: ShowKind): Long
}
