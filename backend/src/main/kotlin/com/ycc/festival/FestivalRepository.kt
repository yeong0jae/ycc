package com.ycc.festival

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface FestivalRepository : JpaRepository<Festival, Long> {
	fun findByEndDateGreaterThanEqualOrderByStartDateAsc(date: LocalDate): List<Festival>
}
