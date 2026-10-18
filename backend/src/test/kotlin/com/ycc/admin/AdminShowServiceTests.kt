package com.ycc.admin

import com.ycc.show.ReviewStatus
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import com.ycc.user.Role
import com.ycc.user.User
import com.ycc.user.UserRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import kotlin.test.assertEquals

@SpringBootTest
class AdminShowServiceTests(
	@Autowired private val adminShowService: AdminShowService,
	@Autowired private val showRepository: ShowRepository,
	@Autowired private val userRepository: UserRepository,
) {

	private lateinit var admin: User
	private lateinit var user: User

	private fun show(kopisId: String) = showRepository.save(
		Show(kopisId, "페스티벌 $kopisId", LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-01"), "공원", "http://example.com/p.jpg", null, null, null, null),
	)

	@AfterEach
	fun clear() {
		showRepository.deleteAll()
		userRepository.deleteAll()
	}

	@BeforeEach
	fun setUp() {
		clear()
		admin = userRepository.save(User(kakaoId = 1, role = Role.ADMIN))
		user = userRepository.save(User(kakaoId = 2))
	}

	@Test
	fun `새 공연은 대기이고, 관리자가 여러 개를 한 번에 띄우거나 무시할 수 있다`() {
		val shows = listOf(show("PF1"), show("PF2"), show("PF3"))

		adminShowService.review(admin, ReviewRequest(shows.take(2).map { it.id }, ReviewStatus.VISIBLE))
		adminShowService.review(admin, ReviewRequest(listOf(shows[2].id), ReviewStatus.HIDDEN))

		val page = adminShowService.shows(admin, ReviewStatus.VISIBLE, 0)
		assertEquals(listOf("PF1", "PF2"), page.items.map { it.show.name.removePrefix("페스티벌 ") })
		assertEquals(mapOf(ReviewStatus.PENDING to 0L, ReviewStatus.VISIBLE to 2L, ReviewStatus.HIDDEN to 1L), page.counts)
	}

	@Test
	fun `관리자가 아니면 검수할 수 없다`() {
		val show = show("PF1")

		assertThrows<ResponseStatusException> { adminShowService.shows(user, ReviewStatus.PENDING, 0) }
		assertThrows<ResponseStatusException> { adminShowService.review(user, ReviewRequest(listOf(show.id), ReviewStatus.VISIBLE)) }
	}
}
