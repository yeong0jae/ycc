package com.ycc.log

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
import java.time.LocalDateTime

enum class Moment { GOODS, ENTRY, BEFORE_SHOW, AFTER }

enum class LogStatus { DRAFT, READY }

@Entity
@Table(name = "show_logs")
class ShowLog(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	var song: String? = null,
	var note: String? = null,
	@Enumerated(EnumType.STRING)
	var status: LogStatus = LogStatus.DRAFT,
	var videoPath: String? = null,
	var thumbnailPath: String? = null,
	val createdAt: LocalDateTime = LocalDateTime.now(),
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

@Entity
@Table(name = "show_log_clips")
class ShowLogClip(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "log_id")
	val log: ShowLog,
	@Enumerated(EnumType.STRING)
	val moment: Moment,
	var durationMs: Int,
	var path: String?,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)
