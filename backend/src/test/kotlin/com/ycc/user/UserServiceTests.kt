package com.ycc.user

import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import kotlin.test.assertEquals

@SpringBootTest
class UserServiceTests(
	@Autowired private val userService: UserService,
	@Autowired private val userRepository: UserRepository,
) {

	@BeforeEach
	fun clear() = userRepository.deleteAll()

	@Test
	fun `같은 카카오 회원은 한 번만 만든다`() {
		val first = userService.findOrCreate(3003)
		val second = userService.findOrCreate(3003)

		assertEquals(first.id, second.id)
		assertEquals(1, userRepository.count())
	}
}
