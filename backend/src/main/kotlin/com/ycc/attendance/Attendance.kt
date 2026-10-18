package com.ycc.attendance

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
import java.time.LocalDate
import java.time.LocalDateTime

enum class AttendanceStatus { GOING, ATTENDED }

@Entity
@Table(name = "attendances")
class Attendance(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	val showDate: LocalDate,
	@Enumerated(EnumType.STRING)
	var status: AttendanceStatus,
	val createdAt: LocalDateTime = LocalDateTime.now(),
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)
