package com.ycc.notice

import com.ycc.organizer.Organizer
import com.ycc.show.Show
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime

enum class NoticeKind { URGENT, SCHEDULE, INFO }

@Entity
@Table(name = "notices")
class Notice(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "organizer_id")
	val organizer: Organizer,
	@Enumerated(EnumType.STRING)
	var kind: NoticeKind,
	var title: String,
	var body: String?,
	val createdAt: LocalDateTime,
	var updatedAt: LocalDateTime? = null,
	var deletedAt: LocalDateTime? = null,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
) {
	@OneToMany(mappedBy = "notice")
	@OrderBy("position")
	val images: MutableList<NoticeImage> = mutableListOf()
}

@Entity
@Table(name = "notice_images")
class NoticeImage(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "organizer_id")
	val organizer: Organizer,
	val storageKey: String,
	val url: String,
	val width: Int,
	val height: Int,
	val createdAt: LocalDateTime,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "notice_id")
	var notice: Notice? = null,
	var position: Int = 0,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface NoticeRepository : JpaRepository<Notice, Long> {
	@Query("select distinct n from Notice n join fetch n.organizer left join fetch n.images where n.show.id = :showId and n.deletedAt is null order by n.createdAt desc, n.id desc")
	fun findVisibleByShowId(showId: Long): List<Notice>

	@Query("select n from Notice n join fetch n.show where n.show.id in :showIds and n.deletedAt is null order by n.createdAt desc, n.id desc")
	fun findVisibleByShowIds(showIds: Collection<Long>): List<Notice>

	@Query("select distinct n.show.id from Notice n")
	fun findAllShowIds(): List<Long>
}

interface NoticeImageRepository : JpaRepository<NoticeImage, Long> {
	@Query("select i from NoticeImage i where i.notice is null and i.createdAt < :before")
	fun findUnattachedBefore(before: LocalDateTime): List<NoticeImage>
}
