package com.ycc.map

import com.ycc.ai.VertexGemini
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import tools.jackson.databind.ObjectMapper

data class FoundPin(val kind: PinKind, val name: String, val x: Double, val y: Double)

data class Crop(val x: Double, val y: Double, val w: Double, val h: Double)

data class FoundMap(val area: Crop?, val pins: List<FoundPin>)

interface MapPinFinder {
	val available: Boolean

	fun find(bytes: ByteArray, contentType: String): FoundMap
}

class DisabledMapPinFinder : MapPinFinder {
	override val available = false

	override fun find(bytes: ByteArray, contentType: String) = FoundMap(null, emptyList())
}

class VertexMapPinFinder(
	private val gemini: VertexGemini,
	private val objectMapper: ObjectMapper,
) : MapPinFinder {

	private val log = LoggerFactory.getLogger(javaClass)

	override val available = true

	override fun find(bytes: ByteArray, contentType: String): FoundMap =
		parse(objectMapper, gemini.generate(bytes, contentType, PROMPT, RESPONSE_SCHEMA))
			.also { log.info("맵에서 장소 {}개를 찾았어요", it.pins.size) }

	companion object {
		private const val MAX_NAME = 60

		fun parse(objectMapper: ObjectMapper, response: String): FoundMap {
			val root = objectMapper.readTree(VertexGemini.text(objectMapper, response))
			val pins = root.path("places").mapNotNull { node ->
				val kind = runCatching { PinKind.valueOf(node.path("kind").asText()) }.getOrDefault(PinKind.ETC)
				val name = node.path("name").asText().trim().take(MAX_NAME)
				val box = box(node.path("box_2d")) ?: return@mapNotNull null
				if (name.isEmpty()) return@mapNotNull null
				FoundPin(kind, name, box.x + box.w / 2, box.y + box.h / 2)
			}
			val area = box(root.path("map_area"))?.takeIf { it.w >= MIN_AREA && it.h >= MIN_AREA }
			return FoundMap(area, pins)
		}

		private fun box(node: tools.jackson.databind.JsonNode): Crop? {
			val values = (0 until node.size()).map { node.get(it).asDouble() / 1000 }
			if (values.size != 4) return null
			val (ymin, xmin, ymax, xmax) = values.map { it.coerceIn(0.0, 1.0) }
			if (xmax <= xmin || ymax <= ymin) return null
			return Crop(xmin, ymin, xmax - xmin, ymax - ymin)
		}

		private const val MIN_AREA = 0.2
		private val PROMPT = """
			이 이미지는 공연·페스티벌 현장 안내 맵이에요. 관객이 찾아갈 장소를 모두 찾아 주세요.
			- kind: STAGE(무대·스테이지), RESTROOM(화장실), FOOD(푸드존·푸드트럭·음식·카페), GOODS(굿즈·MD·마켓·부스 판매), INFO(종합안내·티켓부스·매표·물품보관·의무실), GATE(입구·게이트·출입구), ETC(그 밖의 장소)
			- name: 맵에 적힌 이름 그대로(한글이 있으면 한글). 같은 종류가 여러 곳이면 각각 따로
			- box_2d: 그 장소 아이콘이나 글자의 위치 [ymin, xmin, ymax, xmax], 0~1000
			길·화살표·방향 안내·나무 같은 장식은 빼 주세요.
			map_area: 이미지에서 제목·로고·날짜 같은 꾸밈을 뺀 실제 지도 부분의 위치 [ymin, xmin, ymax, xmax], 0~1000. 이미지 전체가 지도면 [0, 0, 1000, 1000]
		""".trimIndent()
		private val BOX = mapOf("type" to "ARRAY", "items" to mapOf("type" to "NUMBER"))
		private val RESPONSE_SCHEMA = mapOf(
			"type" to "OBJECT",
			"properties" to mapOf(
				"map_area" to BOX,
				"places" to mapOf(
					"type" to "ARRAY",
					"items" to mapOf(
						"type" to "OBJECT",
						"properties" to mapOf(
							"kind" to mapOf("type" to "STRING", "enum" to PinKind.entries.map { it.name }),
							"name" to mapOf("type" to "STRING"),
							"box_2d" to BOX,
						),
						"required" to listOf("kind", "name", "box_2d"),
					),
				),
			),
			"required" to listOf("map_area", "places"),
		)
	}
}

@Configuration
class MapPinFinderConfig {

	@Bean
	fun mapPinFinder(
		@Value("\${app.map-ai.enabled:false}") enabled: Boolean,
		@Value("\${app.map-ai.location:global}") location: String,
		@Value("\${app.map-ai.model:gemini-2.5-flash}") model: String,
		objectMapper: ObjectMapper,
	): MapPinFinder = if (enabled) VertexMapPinFinder(VertexGemini(location, model, objectMapper), objectMapper) else DisabledMapPinFinder()
}
