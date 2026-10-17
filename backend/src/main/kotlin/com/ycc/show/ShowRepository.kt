package com.ycc.show

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate

interface ShowRepository : JpaRepository<Show, Long> {
	fun findByEndDateGreaterThanEqualOrderByStartDateAsc(date: LocalDate): List<Show>

	fun findByKopisId(kopisId: String): Show?
}
