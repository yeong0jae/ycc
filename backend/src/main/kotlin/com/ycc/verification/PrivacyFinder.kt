package com.ycc.verification

import com.ycc.ai.VertexGemini
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.awt.Color
import java.awt.image.BufferedImage
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import javax.imageio.ImageIO

data class Box(val x: Double, val y: Double, val w: Double, val h: Double)

interface PrivacyFinder {
	fun find(bytes: ByteArray, contentType: String): List<Box>
}

class BandPrivacyFinder : PrivacyFinder {
	override fun find(bytes: ByteArray, contentType: String) = listOf(Box(0.0, 0.4, 1.0, 0.2))
}

class VertexPrivacyFinder(
	private val gemini: VertexGemini,
	private val objectMapper: ObjectMapper,
) : PrivacyFinder {

	private val log = LoggerFactory.getLogger(javaClass)

	override fun find(bytes: ByteArray, contentType: String): List<Box> =
		parse(objectMapper, gemini.generate(bytes, contentType, PROMPT, RESPONSE_SCHEMA))
			.also { log.info("예매 캡처에서 가릴 곳 {}개를 찾았어요", it.size) }

	companion object {
		fun parse(objectMapper: ObjectMapper, response: String): List<Box> =
			objectMapper.readTree(VertexGemini.text(objectMapper, response)).path("items").mapNotNull { box(it.path("box_2d")) }

		private fun box(node: JsonNode): Box? {
			val values = (0 until node.size()).map { node.get(it).asDouble() / 1000 }
			if (values.size != 4) return null
			val (ymin, xmin, ymax, xmax) = values.map { it.coerceIn(0.0, 1.0) }
			if (xmax <= xmin || ymax <= ymin) return null
			return Box(xmin, ymin, xmax - xmin, ymax - ymin)
		}

		private val PROMPT = """
			이 이미지는 공연 예매 내역 캡처예요. 개인정보가 적힌 곳을 모두 찾아 주세요.
			- 가릴 것: 예매자·수령인 이름, 전화번호, 이메일, 주소, 생년월일, 예매번호·주문번호·티켓번호, 카드·계좌 번호, 바코드·QR 코드, 아이디
			- 가리지 말 것: 공연 이름, 공연 날짜·시간, 장소, 좌석·등급, 매수, 예매 상태(예매 완료·취소 등), 결제 금액
			- box_2d: 그 글자(또는 코드)의 위치 [ymin, xmin, ymax, xmax], 0~1000. 항목마다 따로
			가릴 것이 없으면 빈 목록으로 주세요.
		""".trimIndent()
		private val RESPONSE_SCHEMA = mapOf(
			"type" to "OBJECT",
			"properties" to mapOf(
				"items" to mapOf(
					"type" to "ARRAY",
					"items" to mapOf(
						"type" to "OBJECT",
						"properties" to mapOf(
							"kind" to mapOf("type" to "STRING"),
							"box_2d" to mapOf("type" to "ARRAY", "items" to mapOf("type" to "NUMBER")),
						),
						"required" to listOf("kind", "box_2d"),
					),
				),
			),
			"required" to listOf("items"),
		)
	}
}

object ImageMask {
	private const val PADDING = 0.006

	fun paint(bytes: ByteArray, boxes: List<Box>): ByteArray {
		val source = ImageIO.read(ByteArrayInputStream(bytes))
		val image = BufferedImage(source.width, source.height, BufferedImage.TYPE_INT_RGB)
		val graphics = image.createGraphics()
		graphics.drawImage(source, 0, 0, Color.WHITE, null)
		graphics.color = Color.BLACK
		boxes.forEach {
			val x = ((it.x - PADDING) * image.width).toInt().coerceAtLeast(0)
			val y = ((it.y - PADDING) * image.height).toInt().coerceAtLeast(0)
			val w = ((it.w + PADDING * 2) * image.width).toInt() + 1
			val h = ((it.h + PADDING * 2) * image.height).toInt() + 1
			graphics.fillRect(x, y, w, h)
		}
		graphics.dispose()
		return ByteArrayOutputStream().also { ImageIO.write(image, "jpg", it) }.toByteArray()
	}
}

@Configuration
class PrivacyFinderConfig {

	@Bean
	fun privacyFinder(
		@Value("\${app.map-ai.enabled:false}") enabled: Boolean,
		@Value("\${app.map-ai.location:global}") location: String,
		@Value("\${app.map-ai.model:gemini-2.5-flash}") model: String,
		objectMapper: ObjectMapper,
	): PrivacyFinder = if (enabled) VertexPrivacyFinder(VertexGemini(location, model, objectMapper), objectMapper) else BandPrivacyFinder()
}
