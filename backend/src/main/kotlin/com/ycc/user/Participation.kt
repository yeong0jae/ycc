package com.ycc.user

import com.ycc.show.Show
import jakarta.persistence.Entity
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

@Entity
@Table(name = "participations")
class Participation(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	val createdAt: LocalDateTime,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface ParticipationRepository : JpaRepository<Participation, Long> {
	@Query("select p.show.id from Participation p where p.user.id = :userId order by p.createdAt desc, p.id desc")
	fun findShowIdsByUserId(userId: Long): List<Long>

	fun deleteByUserIdAndShowId(userId: Long, showId: Long)
}
