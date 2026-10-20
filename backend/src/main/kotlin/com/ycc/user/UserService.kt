package com.ycc.user

import com.ycc.show.ShowRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDateTime

@Service
class UserService(
	private val userRepository: UserRepository,
	private val participationRepository: ParticipationRepository,
	private val showRepository: ShowRepository,
	private val clock: Clock,
) {

	@Transactional
	fun findOrCreate(kakaoId: Long): User {
		val user = userRepository.findByKakaoId(kakaoId) ?: userRepository.save(User(kakaoId, createdAt = LocalDateTime.now(clock)))
		if (user.nickname == null) user.nickname = randomNickname()
		return user
	}

	fun get(kakaoId: Long): User =
		userRepository.findByKakaoId(kakaoId) ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)

	@Transactional
	fun updateNickname(kakaoId: Long, nickname: String): User {
		val trimmed = nickname.trim()
		if (trimmed.length !in NICKNAME_LENGTH) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임은 ${NICKNAME_LENGTH.first}~${NICKNAME_LENGTH.last}자로 정해 주세요.")
		}
		val user = get(kakaoId)
		val owner = userRepository.findByNickname(trimmed)
		if (owner != null && owner.id != user.id) {
			throw ResponseStatusException(HttpStatus.CONFLICT, "이미 누가 쓰는 닉네임이에요.")
		}
		user.nickname = trimmed
		return user
	}

	@Transactional(readOnly = true)
	fun randomNickname(): String =
		generateSequence { RandomNickname.next() }.take(MAX_TRIES).firstOrNull { userRepository.findByNickname(it) == null }
			?: throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "닉네임을 만들지 못했어요. 다시 시도해 주세요.")

	@Transactional(readOnly = true)
	fun participations(kakaoId: Long): List<Long> = participationRepository.findShowIdsByUserId(get(kakaoId).id)

	@Transactional
	fun participate(kakaoId: Long, showIds: List<Long>): List<Long> {
		val user = get(kakaoId)
		val existing = participationRepository.findShowIdsByUserId(user.id).toSet()
		val now = LocalDateTime.now(clock)
		showRepository.findAllById(showIds.distinct().filter { it !in existing }.take(MAX_PARTICIPATIONS))
			.forEach { participationRepository.save(Participation(user, it, now)) }
		return participationRepository.findShowIdsByUserId(user.id)
	}

	@Transactional
	fun leave(kakaoId: Long, showId: Long): List<Long> {
		val user = get(kakaoId)
		participationRepository.deleteByUserIdAndShowId(user.id, showId)
		return participationRepository.findShowIdsByUserId(user.id)
	}

	@Transactional
	fun withdraw(kakaoId: Long) {
		userRepository.delete(get(kakaoId))
	}

	companion object {
		private val NICKNAME_LENGTH = 2..12
		private const val MAX_TRIES = 20
		private const val MAX_PARTICIPATIONS = 200
	}
}
