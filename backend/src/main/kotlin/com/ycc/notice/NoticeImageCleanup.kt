package com.ycc.notice

import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class NoticeImageCleanup(private val noticeService: NoticeService) {

	private val log = LoggerFactory.getLogger(javaClass)

	@Scheduled(cron = "0 30 * * * *", zone = "Asia/Seoul")
	fun run() {
		runCatching { noticeService.deleteUnattachedImages() }
			.onFailure { log.error("공지에 붙지 않은 이미지 정리 실패", it) }
	}
}
