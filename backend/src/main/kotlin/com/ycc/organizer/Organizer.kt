package com.ycc.organizer

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
@Table(name = "organizers")
class Organizer(
	val username: String,
	var passwordHash: String,
	var displayName: String,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	var show: Show,
	val createdAt: LocalDateTime,
	var active: Boolean = true,
	var failedLogins: Int = 0,
	var lockedUntil: LocalDateTime? = null,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface OrganizerRepository : JpaRepository<Organizer, Long> {
	fun findByUsername(username: String): Organizer?

	fun existsByUsername(username: String): Boolean

	fun existsByShowId(showId: Long): Boolean

	@Query("select o from Organizer o join fetch o.show order by o.createdAt desc, o.id desc")
	fun findAllWithShow(): List<Organizer>

	@Query("select o.show.id from Organizer o")
	fun findAllShowIds(): List<Long>
}
