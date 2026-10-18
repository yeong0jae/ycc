package com.ycc.attendance

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface AttendanceRepository : JpaRepository<Attendance, Long> {
	fun findByUserIdAndShowIdAndShowDate(userId: Long, showId: Long, showDate: LocalDate): Attendance?

	fun findByUserIdAndShowIdOrderByShowDate(userId: Long, showId: Long): List<Attendance>

	@Query("select a from Attendance a join fetch a.show where a.user.id = :userId and a.showDate >= :today order by a.showDate, a.id")
	fun findUpcoming(userId: Long, today: LocalDate): List<Attendance>

	@Query("select a from Attendance a join fetch a.show where a.user.id = :userId and a.showDate < :today order by a.showDate desc, a.id desc")
	fun findPast(userId: Long, today: LocalDate): List<Attendance>

	@Query("select a from Attendance a join fetch a.show s left join fetch s.facility where a.user.id = :userId and a.status = com.ycc.attendance.AttendanceStatus.ATTENDED order by a.showDate desc, a.id desc")
	fun findAttended(userId: Long): List<Attendance>

	fun existsByShowId(showId: Long): Boolean
}
