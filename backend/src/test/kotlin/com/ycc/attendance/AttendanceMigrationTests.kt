package com.ycc.attendance

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.datasource.DriverManagerDataSource
import kotlin.test.assertEquals

class AttendanceMigrationTests {

	private val dataSource = DriverManagerDataSource("jdbc:h2:mem:migration;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "sa", "")
	private val jdbc = JdbcTemplate(dataSource)

	private fun migrate(target: String) = Flyway.configure().dataSource(dataSource).target(target).load().migrate()

	@Test
	fun `갈 거예요는 갈 예정으로, 로그 남긴 공연은 다녀옴으로 옮긴다`() {
		migrate("7")
		jdbc.update("INSERT INTO users (id, kakao_id, created_at) VALUES (1, 1, NOW())")
		listOf(10 to "2026-10-01", 11 to "2026-11-01", 12 to "2026-09-01").forEach { (id, date) ->
			jdbc.update(
				"INSERT INTO shows (id, kopis_id, name, start_date, end_date, venue, poster_url) VALUES (?, ?, '공연', ?, ?, '홀', 'p')",
				id, "PF$id", date, date,
			)
		}
		jdbc.update("INSERT INTO show_plans (user_id, show_id, created_at) VALUES (1, 10, NOW()), (1, 11, NOW())")
		jdbc.update("INSERT INTO show_logs (user_id, show_id, visibility, status, created_at) VALUES (1, 10, 'PUBLIC', 'READY', NOW()), (1, 12, 'PUBLIC', 'READY', NOW())")

		migrate("8")

		val rows = jdbc.queryForList("SELECT show_id, show_date, status FROM attendances ORDER BY show_id")
			.map { Triple((it["show_id"] as Number).toLong(), it["show_date"].toString(), it["status"]) }
		assertEquals(
			listOf(Triple(10L, "2026-10-01", "ATTENDED"), Triple(11L, "2026-11-01", "GOING"), Triple(12L, "2026-09-01", "ATTENDED")),
			rows,
		)
	}
}
