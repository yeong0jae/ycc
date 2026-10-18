package com.ycc.user

import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

enum class Role { USER, ADMIN }

@Entity
@Table(name = "users")
class User(
	val kakaoId: Long,
	var nickname: String? = null,
	@Enumerated(EnumType.STRING)
	var gender: Gender? = null,
	@Enumerated(EnumType.STRING)
	var role: Role = Role.USER,
	val createdAt: LocalDateTime = LocalDateTime.now(),
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
) {
	val onboarded: Boolean get() = nickname != null && gender != null

	val admin: Boolean get() = role == Role.ADMIN
}
