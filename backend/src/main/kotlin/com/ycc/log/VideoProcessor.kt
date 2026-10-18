package com.ycc.log

import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.TimeUnit

interface VideoProcessor {
	fun durationSeconds(video: Path): Double

	fun merge(clips: List<Path>, output: Path)

	fun thumbnail(video: Path, output: Path)
}

@Component
class FfmpegVideoProcessor : VideoProcessor {

	override fun durationSeconds(video: Path): Double {
		val declared = run(
			"ffprobe", "-v", "error", "-show_entries", "format=duration",
			"-of", "default=noprint_wrappers=1:nokey=1", video.toString(),
		).trim().toDoubleOrNull()
		if (declared != null && declared > 0) return declared
		val (rate, frames) = run(
			"ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
			"-show_entries", "stream=avg_frame_rate,nb_read_frames", "-of", "csv=p=0", video.toString(),
		).trim().split(",")
		val (num, den) = rate.split("/").map { it.toDoubleOrNull() ?: 0.0 }
		val fps = if (den > 0) num / den else 0.0
		return if (fps > 0) (frames.toDoubleOrNull() ?: 0.0) / fps else 0.0
	}

	override fun merge(clips: List<Path>, output: Path) {
		Files.createDirectories(output.parent)
		val inputs = clips.flatMap { listOf("-t", CLIP_SECONDS.toString(), "-i", it.toString()) }
		val scaled = clips.indices.joinToString("") {
			"[$it:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,fps=30[v$it];"
		}
		val concat = clips.indices.joinToString("") { "[v$it]" } + "concat=n=${clips.size}:v=1:a=0[v]"
		run(
			"ffmpeg", "-y", *inputs.toTypedArray(),
			"-filter_complex", scaled + concat, "-map", "[v]",
			"-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p",
			"-movflags", "+faststart", output.toString(),
		)
	}

	override fun thumbnail(video: Path, output: Path) {
		Files.createDirectories(output.parent)
		run("ffmpeg", "-y", "-ss", "0.5", "-i", video.toString(), "-frames:v", "1", "-vf", "scale=360:-2", output.toString())
	}

	private fun run(vararg command: String): String {
		val process = ProcessBuilder(*command).redirectErrorStream(true).start()
		val output = process.inputStream.bufferedReader().readText()
		if (!process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
			process.destroyForcibly()
			error("${command.first()} 시간 초과")
		}
		check(process.exitValue() == 0) { "${command.first()} 실패: ${output.takeLast(500)}" }
		return output
	}

	companion object {
		const val CLIP_SECONDS = 4
		private const val TIMEOUT_SECONDS = 60L
	}
}
