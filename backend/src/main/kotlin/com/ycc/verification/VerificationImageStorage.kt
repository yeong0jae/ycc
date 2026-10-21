package com.ycc.verification

import com.ycc.notice.GcsNoticeImageStorage
import com.ycc.notice.LocalNoticeImageStorage
import com.ycc.notice.NoticeImageStorage
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.nio.file.Path

class VerificationImageStorage(private val delegate: NoticeImageStorage) {
	fun put(key: String, bytes: ByteArray, contentType: String) {
		delegate.put(key, bytes, contentType)
	}

	fun delete(key: String) = delegate.delete(key)

	fun read(key: String): ByteArray = delegate.read(key)
}

@Configuration
class VerificationImageStorageConfig {

	@Bean
	fun verificationImageStorage(
		@Value("\${app.verification-images.bucket:}") bucket: String,
		@Value("\${app.verification-images.dir:data/verification-images}") dir: String,
	) = VerificationImageStorage(
		if (bucket.isNotBlank()) GcsNoticeImageStorage(bucket) else LocalNoticeImageStorage(Path.of(dir).toAbsolutePath()),
	)
}
