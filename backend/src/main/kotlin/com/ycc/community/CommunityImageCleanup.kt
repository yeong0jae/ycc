package com.ycc.community

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class CommunityImageCleanup(private val communityService: CommunityService) {

	private val log = LoggerFactory.getLogger(javaClass)

	@Scheduled(cron = "0 40 * * * *", zone = "Asia/Seoul")
	fun run() {
		runCatching { communityService.deleteUnattachedImages() }
			.onFailure { log.error("글에 붙지 않은 커뮤니티 사진 정리 실패", it) }
	}
}
