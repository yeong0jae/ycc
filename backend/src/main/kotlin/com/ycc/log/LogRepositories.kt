package com.ycc.log

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate

interface ShowLogRepository : JpaRepository<ShowLog, Long> {
	fun findByUserIdAndShowId(userId: Long, showId: Long): ShowLog?

	@Query("select l from ShowLog l join fetch l.show join fetch l.user where l.user.id = :userId and l.status = com.ycc.log.LogStatus.READY order by l.show.startDate desc")
	fun findReadyByUser(userId: Long): List<ShowLog>

	@Query("select l from ShowLog l join fetch l.user where l.show.id = :showId and l.status = com.ycc.log.LogStatus.READY and l.visibility = com.ycc.log.Visibility.PUBLIC and l.user.id <> :excludeUserId order by l.createdAt desc")
	fun findPublicByShowExcept(showId: Long, excludeUserId: Long): List<ShowLog>

	fun existsByUserIdAndShowIdAndStatus(userId: Long, showId: Long, status: LogStatus): Boolean

	fun existsByShowId(showId: Long): Boolean
}

interface ShowLogClipRepository : JpaRepository<ShowLogClip, Long> {
	fun findByLogId(logId: Long): List<ShowLogClip>

	fun findByLogIdAndMoment(logId: Long, moment: Moment): ShowLogClip?

	fun countByLogId(logId: Long): Long
}

interface ShowPlanRepository : JpaRepository<ShowPlan, Long> {
	fun findByUserIdAndShowId(userId: Long, showId: Long): ShowPlan?

	@Query("select p from ShowPlan p join fetch p.show where p.user.id = :userId and p.show.endDate >= :today order by p.show.startDate")
	fun findUpcomingByUser(userId: Long, today: LocalDate): List<ShowPlan>

	@Query("select p from ShowPlan p join fetch p.user where p.show.id = :showId and p.user.id <> :excludeUserId order by p.createdAt")
	fun findByShowExcept(showId: Long, excludeUserId: Long): List<ShowPlan>

	fun existsByShowId(showId: Long): Boolean
}

interface LogSignalRepository : JpaRepository<LogSignal, Long> {
	fun findByFromUserIdAndToUserIdAndShowIdAndKind(fromUserId: Long, toUserId: Long, showId: Long, kind: SignalKind): LogSignal?

	fun existsByFromUserIdAndToUserIdAndShowIdAndKind(fromUserId: Long, toUserId: Long, showId: Long, kind: SignalKind): Boolean

	@Modifying
	@Query("delete from LogSignal s where s.show.id = :showId and s.kind = :kind and (s.fromUser.id = :userId or s.toUser.id = :userId)")
	fun deleteForUserAndShow(userId: Long, showId: Long, kind: SignalKind)
}
