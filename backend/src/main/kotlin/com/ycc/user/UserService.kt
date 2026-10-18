package com.ycc.user

import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
class UserService(private val userRepository: UserRepository) {

	@Transactional
	fun findOrCreate(kakaoId: Long): User =
		userRepository.findByKakaoId(kakaoId) ?: userRepository.save(User(kakaoId))

	fun get(kakaoId: Long): User =
		userRepository.findByKakaoId(kakaoId) ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)

	@Transactional
	fun updateProfile(kakaoId: Long, nickname: String, gender: Gender): User {
		val trimmed = nickname.trim()
		if (trimmed.length !in NICKNAME_LENGTH) {
			throw ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임은 2~12자로 정해 주세요.")
		}
		val user = get(kakaoId)
		val owner = userRepository.findByNickname(trimmed)
		if (owner != null && owner.id != user.id) {
			throw ResponseStatusException(HttpStatus.CONFLICT, "이미 쓰고 있는 닉네임이에요.")
		}
		user.nickname = trimmed
		user.gender = gender
		return user
	}

	companion object {
		private val NICKNAME_LENGTH = 2..12
	}
}
