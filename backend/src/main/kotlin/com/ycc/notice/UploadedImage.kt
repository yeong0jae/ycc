package com.ycc.notice

import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.io.ByteArrayInputStream
import javax.imageio.ImageIO

class UploadedImage(val bytes: ByteArray, val contentType: String, val extension: String, val width: Int, val height: Int) {
	companion object {
		private const val MAX_BYTES = 10 * 1024 * 1024
		private val TYPES = mapOf("image/jpeg" to "jpg", "image/png" to "png")

		fun read(bytes: ByteArray, contentType: String?): UploadedImage {
			if (bytes.size > MAX_BYTES) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지는 10MB까지 올릴 수 있어요.")
			val extension = TYPES[contentType]
				?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "jpg·png·webp 이미지만 올릴 수 있어요.")
			val image = runCatching { ImageIO.read(ByteArrayInputStream(bytes)) }.getOrNull()
				?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지를 읽지 못했어요.")
			return UploadedImage(bytes, contentType!!, extension, image.width, image.height)
		}
	}
}
