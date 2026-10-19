package com.ycc.request

import com.ycc.show.ShowKind
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

enum class ShowRequestStatus { PENDING, DONE, IGNORED }

@Entity
@Table(name = "show_requests")
class ShowRequest(
	@Enumerated(EnumType.STRING)
	val kind: ShowKind,
	val name: String,
	val url: String?,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User?,
	val createdAt: LocalDateTime,
	@Enumerated(EnumType.STRING)
	var status: ShowRequestStatus = ShowRequestStatus.PENDING,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface ShowRequestRepository : JpaRepository<ShowRequest, Long> {
	@Query("select r from ShowRequest r left join fetch r.user where r.status = :status order by r.createdAt desc, r.id desc")
	fun findByStatusWithUser(status: ShowRequestStatus): List<ShowRequest>

	fun countByStatus(status: ShowRequestStatus): Long
}
