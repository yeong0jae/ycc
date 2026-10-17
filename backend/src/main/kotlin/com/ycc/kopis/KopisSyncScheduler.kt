package com.ycc.kopis

import org.slf4j.LoggerFactory
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class KopisSyncScheduler(
	private val kopisClient: KopisClient,
	private val kopisSyncService: KopisSyncService,
) {

	private val log = LoggerFactory.getLogger(javaClass)

	@EventListener(ApplicationReadyEvent::class)
	@Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
	fun run() {
		if (!kopisClient.enabled) {
			log.info("KOPIS_API_KEY가 없어 동기화를 건너뜁니다")
			return
		}
		runCatching { kopisSyncService.sync() }
			.onSuccess { log.info("KOPIS 동기화 완료: {}건", it) }
			.onFailure { log.error("KOPIS 동기화 실패", it) }
	}
}
