package com.ycc.organizer

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Duration
import java.time.LocalDateTime

sealed interface LoginResult {
	data class Success(val organizerId: Long) : LoginResult
	data object Invalid : LoginResult
	data object Locked : LoginResult
	data object Inactive : LoginResult
}

@Service
@Transactional
class OrganizerAuthService(
	private val organizerRepository: OrganizerRepository,
	private val passwordEncoder: PasswordEncoder,
	private val clock: Clock,
) {

	fun login(username: String, password: String): LoginResult {
		val organizer = organizerRepository.findByUsername(username) ?: return LoginResult.Invalid
		val now = LocalDateTime.now(clock)
		if (organizer.lockedUntil?.isAfter(now) == true) return LoginResult.Locked
		if (!passwordEncoder.matches(password, organizer.passwordHash)) {
			organizer.failedLogins += 1
			if (organizer.failedLogins >= MAX_FAILURES) {
				organizer.failedLogins = 0
				organizer.lockedUntil = now.plus(LOCK_DURATION)
				return LoginResult.Locked
			}
			return LoginResult.Invalid
		}
		organizer.failedLogins = 0
		organizer.lockedUntil = null
		if (!organizer.active) return LoginResult.Inactive
		return LoginResult.Success(organizer.id)
	}

	companion object {
		private const val MAX_FAILURES = 5
		private val LOCK_DURATION = Duration.ofMinutes(10)
	}
}
