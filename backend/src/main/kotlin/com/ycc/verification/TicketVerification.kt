package com.ycc.verification

import com.ycc.dev.Developer
import com.ycc.show.Show
import com.ycc.user.User
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime

enum class VerificationStatus { PENDING, APPROVED, REJECTED }

enum class RejectReason { WRONG_SHOW, NOT_VISIBLE, CANCELED, OTHER }

@Entity
@Table(name = "ticket_verifications")
class TicketVerification(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	@Enumerated(EnumType.STRING)
	var status: VerificationStatus,
	var imageKey: String?,
	var imageWidth: Int?,
	var imageHeight: Int?,
	var createdAt: LocalDateTime,
	@Enumerated(EnumType.STRING)
	var rejectReason: RejectReason? = null,
	var decidedAt: LocalDateTime? = null,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "developer_id")
	var developer: Developer? = null,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface TicketVerificationRepository : JpaRepository<TicketVerification, Long> {
	fun findByUserIdAndShowId(userId: Long, showId: Long): TicketVerification?

	@Query("select v from TicketVerification v join fetch v.show where v.user.id = :userId order by v.createdAt desc")
	fun findMine(userId: Long): List<TicketVerification>

	@Query("select v from TicketVerification v join fetch v.show join fetch v.user where (:status is null or v.status = :status) order by v.createdAt")
	fun findForReview(status: VerificationStatus?): List<TicketVerification>

	fun countByStatus(status: VerificationStatus): Long

	fun findByUserId(userId: Long): List<TicketVerification>

	@Query(
		"select v.user.id, v.show.id from TicketVerification v where v.status = com.ycc.verification.VerificationStatus.APPROVED" +
			" and v.user.id in :userIds and v.show.id in :showIds",
	)
	fun findApprovedPairs(userIds: Collection<Long>, showIds: Collection<Long>): List<Array<Any>>
}
