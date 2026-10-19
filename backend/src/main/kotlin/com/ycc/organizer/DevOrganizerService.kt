package com.ycc.organizer

import com.ycc.show.ReviewStatus
import com.ycc.show.Show
import com.ycc.show.ShowRepository
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDate
import java.time.LocalDateTime

data class OrganizerShowResponse(val id: Long, val name: String, val startDate: LocalDate, val endDate: LocalDate) {
	companion object {
		fun from(show: Show) = OrganizerShowResponse(show.id, show.name, show.startDate, show.endDate)
	}
}

data class OrganizerResponse(
	val id: Long,
	val username: String,
	val displayName: String,
	val active: Boolean,
	val show: OrganizerShowResponse,
) {
	companion object {
		fun from(organizer: Organizer) = OrganizerResponse(
			organizer.id,
			organizer.username,
			organizer.displayName,
			organizer.active,
			OrganizerShowResponse.from(organizer.show),
		)
	}
}

data class CreateOrganizerRequest(val username: String, val password: String, val displayName: String, val showId: Long)

data class PasswordRequest(val password: String)

data class ShowChangeRequest(val showId: Long)

data class ActiveRequest(val active: Boolean)

@Service
@Transactional
class DevOrganizerService(
	private val organizerRepository: OrganizerRepository,
	private val showRepository: ShowRepository,
	private val passwordEncoder: PasswordEncoder,
	private val clock: Clock,
) {

	@Transactional(readOnly = true)
	fun list() = organizerRepository.findAllWithShow().map(OrganizerResponse::from)

	fun create(request: CreateOrganizerRequest): OrganizerResponse {
		val username = request.username.trim()
		val displayName = request.displayName.trim()
		if (!USERNAME_PATTERN.matches(username)) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "아이디는 영어 소문자·숫자·.-_로 3~30자로 정해 주세요.")
		}
		if (displayName.isEmpty() || displayName.length > MAX_DISPLAY_NAME) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "표시 이름은 1~${MAX_DISPLAY_NAME}자로 적어 주세요.")
		}
		validatePassword(request.password)
		if (organizerRepository.existsByUsername(username)) {
			throw ResponseStatusException(HttpStatus.CONFLICT, "이미 있는 아이디예요.")
		}
		val organizer = Organizer(username, passwordEncoder.encode(request.password)!!, displayName, assignableShow(request.showId), LocalDateTime.now(clock))
		return OrganizerResponse.from(organizerRepository.save(organizer))
	}

	fun changePassword(id: Long, password: String) {
		validatePassword(password)
		get(id).apply {
			passwordHash = passwordEncoder.encode(password)!!
			failedLogins = 0
			lockedUntil = null
		}
	}

	fun changeShow(id: Long, showId: Long): OrganizerResponse {
		val organizer = get(id)
		if (organizer.show.id != showId) organizer.show = assignableShow(showId)
		return OrganizerResponse.from(organizer)
	}

	fun changeActive(id: Long, active: Boolean) {
		get(id).active = active
	}

	@Transactional(readOnly = true)
	fun assignableShows(q: String?): List<OrganizerShowResponse> {
		val taken = organizerRepository.findAllShowIds().toSet()
		val keyword = q?.lowercase()?.replace(Regex("\\s"), "").orEmpty()
		return showRepository.findByReviewStatusOrderByStartDateDescIdDesc(ReviewStatus.VISIBLE)
			.filter { it.id !in taken && it.name.lowercase().replace(Regex("\\s"), "").contains(keyword) }
			.take(MAX_RESULTS)
			.map(OrganizerShowResponse::from)
	}

	private fun get(id: Long) = organizerRepository.findById(id).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }

	private fun assignableShow(showId: Long): Show {
		val show = showRepository.findById(showId).orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "없는 공연이에요.") }
		if (show.reviewStatus != ReviewStatus.VISIBLE) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "띄움 상태인 공연만 고를 수 있어요.")
		}
		if (organizerRepository.existsByShowId(showId)) {
			throw ResponseStatusException(HttpStatus.CONFLICT, "이 공연에는 이미 주최측 계정이 있어요.")
		}
		return show
	}

	private fun validatePassword(password: String) {
		if (password.length < MIN_PASSWORD) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 ${MIN_PASSWORD}자 이상으로 정해 주세요.")
		}
	}

	companion object {
		private const val MIN_PASSWORD = 8
		private const val MAX_DISPLAY_NAME = 50
		private const val MAX_RESULTS = 20
		private val USERNAME_PATTERN = Regex("^[a-z0-9._-]{3,30}$")
	}
}
