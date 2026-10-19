package com.ycc.notice

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.MediaType
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.net.URLEncoder
import java.nio.file.Files
import java.nio.file.Path
import java.time.Instant

interface NoticeImageStorage {
	fun put(key: String, bytes: ByteArray, contentType: String): String

	fun delete(key: String)
}

class LocalNoticeImageStorage(private val root: Path) : NoticeImageStorage {

	override fun put(key: String, bytes: ByteArray, contentType: String): String {
		val file = resolve(key)
		Files.createDirectories(file.parent)
		Files.write(file, bytes)
		return "/api/notice-images/files/$key"
	}

	override fun delete(key: String) {
		Files.deleteIfExists(resolve(key))
	}

	fun resolve(key: String): Path {
		val file = root.resolve(key).normalize()
		require(file.startsWith(root.normalize())) { "잘못된 경로" }
		return file
	}
}

class GcsNoticeImageStorage(private val bucket: String) : NoticeImageStorage {

	private val restClient = RestClient.create()
	private var token: String? = null
	private var tokenExpiresAt: Instant = Instant.EPOCH

	override fun put(key: String, bytes: ByteArray, contentType: String): String {
		restClient.post()
			.uri("https://storage.googleapis.com/upload/storage/v1/b/{bucket}/o?uploadType=media&name={name}", bucket, key)
			.header("Authorization", "Bearer ${accessToken()}")
			.contentType(MediaType.parseMediaType(contentType))
			.body(bytes)
			.retrieve()
			.toBodilessEntity()
		return "https://storage.googleapis.com/$bucket/$key"
	}

	override fun delete(key: String) {
		restClient.delete()
			.uri("https://storage.googleapis.com/storage/v1/b/$bucket/o/${URLEncoder.encode(key, Charsets.UTF_8)}")
			.header("Authorization", "Bearer ${accessToken()}")
			.retrieve()
			.toBodilessEntity()
	}

	@Synchronized
	private fun accessToken(): String {
		val current = token
		if (current != null && Instant.now().isBefore(tokenExpiresAt)) return current
		val response = restClient.get()
			.uri("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token")
			.header("Metadata-Flavor", "Google")
			.retrieve()
			.body<MetadataToken>()!!
		token = response.access_token
		tokenExpiresAt = Instant.now().plusSeconds(response.expires_in - 60)
		return response.access_token
	}

	@Suppress("PropertyName")
	private data class MetadataToken(val access_token: String, val expires_in: Long)
}

@Configuration
class NoticeImageStorageConfig {

	@Bean
	fun noticeImageStorage(
		@Value("\${app.notice-images.bucket:}") bucket: String,
		@Value("\${app.notice-images.dir:data/notice-images}") dir: String,
	): NoticeImageStorage =
		if (bucket.isNotBlank()) GcsNoticeImageStorage(bucket) else LocalNoticeImageStorage(Path.of(dir).toAbsolutePath())
}
