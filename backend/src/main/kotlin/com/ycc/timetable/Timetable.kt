package com.ycc.timetable

import com.ycc.show.Show
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "timetable_stages")
class TimetableStage(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	var name: String,
	var position: Int,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

@Entity
@Table(name = "timetable_slots")
class TimetableSlot(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "stage_id")
	var stage: TimetableStage,
	@Column(name = "show_day")
	var day: LocalDate,
	var startMinute: Int,
	var endMinute: Int,
	var artist: String,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

@Entity
@Table(name = "timetable_images")
class TimetableImage(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	@Column(name = "show_day")
	val day: LocalDate,
	val position: Int,
	val storageKey: String,
	val url: String,
	val width: Int,
	val height: Int,
	val createdAt: LocalDateTime,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface TimetableStageRepository : JpaRepository<TimetableStage, Long> {
	fun findByShowIdOrderByPositionAscIdAsc(showId: Long): List<TimetableStage>
}

interface TimetableSlotRepository : JpaRepository<TimetableSlot, Long> {
	fun findByShowIdOrderByDayAscStartMinuteAscIdAsc(showId: Long): List<TimetableSlot>

	fun deleteByStageId(stageId: Long)
}

interface TimetableImageRepository : JpaRepository<TimetableImage, Long> {
	fun findByShowIdOrderByDayAscPositionAscIdAsc(showId: Long): List<TimetableImage>

	fun countByShowIdAndDay(showId: Long, day: LocalDate): Int
}
