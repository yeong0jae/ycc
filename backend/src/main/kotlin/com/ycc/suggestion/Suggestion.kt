package com.ycc.suggestion

import com.ycc.organizer.Organizer
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

enum class SuggestionSource { SITE_QR, TICKET }

@Entity
@Table(name = "suggestions")
class Suggestion(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	@Enumerated(EnumType.STRING)
	val source: SuggestionSource,
	val deviceId: String?,
	val body: String,
	val createdAt: LocalDateTime,
	val imageKey: String? = null,
	val imageUrl: String? = null,
	val imageWidth: Int? = null,
	val imageHeight: Int? = null,
	var hiddenAt: LocalDateTime? = null,
	var reply: String? = null,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "reply_organizer_id")
	var replyOrganizer: Organizer? = null,
	var repliedAt: LocalDateTime? = null,
	var replyUpdatedAt: LocalDateTime? = null,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User? = null,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

@Entity
@Table(name = "site_passes")
class SitePass(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	val deviceId: String,
	val createdAt: LocalDateTime,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface SuggestionRepository : JpaRepository<Suggestion, Long> {
	@Query("select s from Suggestion s where s.show.id = :showId and s.hiddenAt is null order by s.createdAt desc, s.id desc")
	fun findVisibleByShowId(showId: Long): List<Suggestion>

	fun findByShowIdOrderByCreatedAtDescIdDesc(showId: Long): List<Suggestion>

	fun countByShowIdAndDeviceIdAndCreatedAtAfter(showId: Long, deviceId: String, after: LocalDateTime): Long

	fun countByShowIdAndUserIdAndCreatedAtAfter(showId: Long, userId: Long, after: LocalDateTime): Long
}

interface SitePassRepository : JpaRepository<SitePass, Long> {
	fun existsByShowIdAndDeviceId(showId: Long, deviceId: String): Boolean
}
