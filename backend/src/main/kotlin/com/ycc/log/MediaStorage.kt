package com.ycc.log

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.io.InputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption

@Component
class MediaStorage(@Value("\${app.media-dir}") mediaDir: String) {

	private val root: Path = Path.of(mediaDir)

	fun clipPath(logId: Long, moment: Moment, extension: String): Path =
		root.resolve("clips/$logId/${moment.name.lowercase()}.$extension")

	fun videoPath(logId: Long): Path = root.resolve("logs/$logId.mp4")

	fun thumbnailPath(logId: Long): Path = root.resolve("logs/$logId.jpg")

	fun write(input: InputStream, target: Path) {
		Files.createDirectories(target.parent)
		input.use { Files.copy(it, target, StandardCopyOption.REPLACE_EXISTING) }
	}

	fun resolve(relative: String): Path = root.resolve(relative)

	fun relativize(path: Path): String = root.relativize(path).toString()

	fun delete(relative: String?) {
		if (relative != null) Files.deleteIfExists(root.resolve(relative))
	}
}
