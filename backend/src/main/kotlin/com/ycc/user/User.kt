package com.ycc.user

import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "users")
class User(
	val kakaoId: Long,
	var nickname: String? = null,
	@Enumerated(EnumType.STRING)
	var gender: Gender? = null,
	val createdAt: LocalDateTime = LocalDateTime.now(),
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)
