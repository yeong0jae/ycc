package com.ycc.kopis

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDateTime

@Entity
@Table(name = "kopis_syncs")
class KopisSync(
	val startedAt: LocalDateTime,
	val detailCount: Int,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface KopisSyncRepository : JpaRepository<KopisSync, Long> {
	fun findTopByOrderByStartedAtDesc(): KopisSync?
}
