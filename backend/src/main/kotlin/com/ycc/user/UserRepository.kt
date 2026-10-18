package com.ycc.user

import org.springframework.data.jpa.repository.JpaRepository

interface UserRepository : JpaRepository<User, Long> {
	fun findByKakaoId(kakaoId: Long): User?

	fun findByNickname(nickname: String): User?
}
