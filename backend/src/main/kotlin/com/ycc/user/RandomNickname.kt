package com.ycc.user

import java.security.SecureRandom

object RandomNickname {
	private val random = SecureRandom()
	private val ADJECTIVES = listOf("신나는", "들뜬", "설레는", "반짝이는", "두근대는", "춤추는", "노래하는", "졸린", "배고픈", "용감한", "느긋한", "씩씩한")
	private val NOUNS = listOf("떼창", "응원봉", "앵콜", "헤드폰", "기타", "드럼", "무대", "관객", "스피커", "피크", "팔찌", "깃발")

	fun next(): String =
		ADJECTIVES[random.nextInt(ADJECTIVES.size)] + NOUNS[random.nextInt(NOUNS.size)] + "%04d".format(random.nextInt(10_000))
}
