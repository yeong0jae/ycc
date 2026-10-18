package com.ycc.log

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ShowLogRepository : JpaRepository<ShowLog, Long> {
	fun findByUserIdAndShowId(userId: Long, showId: Long): ShowLog?

	@Query("select l from ShowLog l join fetch l.show join fetch l.user where l.user.id = :userId and l.status = com.ycc.log.LogStatus.READY order by l.show.startDate desc")
	fun findReadyByUser(userId: Long): List<ShowLog>

	fun existsByShowId(showId: Long): Boolean
}

interface ShowLogClipRepository : JpaRepository<ShowLogClip, Long> {
	fun findByLogId(logId: Long): List<ShowLogClip>

	fun findByLogIdAndMoment(logId: Long, moment: Moment): ShowLogClip?

	fun countByLogId(logId: Long): Long
}
