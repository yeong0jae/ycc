package com.ycc.show

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

private const val VISIBLE_MATCH =
	"s.reviewStatus = com.ycc.show.ReviewStatus.VISIBLE and s.kind = :kind and (:pattern is null" +
		" or replace(lower(s.name), ' ', '') like :pattern or replace(lower(s.castText), ' ', '') like :pattern" +
		" or replace(lower(s.venue), ' ', '') like :pattern or replace(lower(s.area), ' ', '') like :pattern)"

interface ShowRepository : JpaRepository<Show, Long> {
	@Query(
		value = "select s from Show s left join fetch s.facility where $VISIBLE_MATCH and s.endDate >= :today order by s.startDate, s.id",
		countQuery = "select count(s) from Show s where $VISIBLE_MATCH and s.endDate >= :today",
	)
	fun searchUpcoming(kind: ShowKind, pattern: String?, today: LocalDate, pageable: Pageable): Page<Show>

	@Query(
		value = "select s from Show s left join fetch s.facility where $VISIBLE_MATCH and s.endDate < :today order by s.startDate desc, s.id desc",
		countQuery = "select count(s) from Show s where $VISIBLE_MATCH and s.endDate < :today",
	)
	fun searchPast(kind: ShowKind, pattern: String?, today: LocalDate, pageable: Pageable): Page<Show>

	@Query("select s from Show s left join fetch s.facility where s.id = :id")
	fun findWithFacilityById(id: Long): Show?

	fun findByKopisId(kopisId: String): Show?

	@Query("select s from Show s join fetch s.facility where s.reviewStatus = com.ycc.show.ReviewStatus.VISIBLE and s.kind = :kind and s.endDate >= :date order by s.startDate")
	fun findUpcomingWithFacility(date: LocalDate, kind: ShowKind): List<Show>

	fun findByReviewStatusAndKindOrderByStartDateAscIdAsc(status: ReviewStatus, kind: ShowKind): List<Show>

	fun countByReviewStatusAndKind(status: ReviewStatus, kind: ShowKind): Long
}
