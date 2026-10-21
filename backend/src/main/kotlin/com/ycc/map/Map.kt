package com.ycc.map

import com.ycc.show.Show
import com.ycc.timetable.TimetableStage
import jakarta.persistence.Column
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
import java.time.LocalDateTime

enum class PinKind { STAGE, RESTROOM, FOOD, GOODS, INFO, GATE, ETC }

@Entity
@Table(name = "map_images")
class MapImage(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	var position: Int,
	val storageKey: String,
	val url: String,
	val width: Int,
	val height: Int,
	val createdAt: LocalDateTime,
	@Column(name = "crop_x")
	var cropX: Double? = null,
	@Column(name = "crop_y")
	var cropY: Double? = null,
	@Column(name = "crop_w")
	var cropW: Double? = null,
	@Column(name = "crop_h")
	var cropH: Double? = null,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

@Entity
@Table(name = "map_pins")
class MapPin(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "image_id")
	val image: MapImage,
	@Enumerated(EnumType.STRING)
	var kind: PinKind,
	var name: String,
	var description: String?,
	var x: Double,
	var y: Double,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "stage_id")
	var stage: TimetableStage?,
	var ai: Boolean,
	val createdAt: LocalDateTime,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface MapImageRepository : JpaRepository<MapImage, Long> {
	fun findByShowIdOrderByPositionAscIdAsc(showId: Long): List<MapImage>
}

interface MapPinRepository : JpaRepository<MapPin, Long> {
	fun findByShowIdOrderByIdAsc(showId: Long): List<MapPin>

	fun deleteByImageId(imageId: Long)
}
