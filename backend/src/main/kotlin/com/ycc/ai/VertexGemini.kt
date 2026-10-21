package com.ycc.ai

import org.springframework.http.MediaType
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import tools.jackson.databind.ObjectMapper
import java.time.Instant
import java.util.Base64

class VertexGemini(
	private val location: String,
	private val model: String,
	private val objectMapper: ObjectMapper,
) {

	private val restClient = RestClient.create()
	private var token: String? = null
	private var tokenExpiresAt: Instant = Instant.EPOCH
	private val project by lazy { metadata("project/project-id") }

	fun generate(bytes: ByteArray, contentType: String, prompt: String, schema: Map<String, Any>): String {
		val host = if (location == "global") "aiplatform.googleapis.com" else "$location-aiplatform.googleapis.com"
		val request = mapOf(
			"contents" to listOf(
				mapOf(
					"role" to "user",
					"parts" to listOf(
						mapOf("inlineData" to mapOf("mimeType" to contentType, "data" to Base64.getEncoder().encodeToString(bytes))),
						mapOf("text" to prompt),
					),
				),
			),
			"generationConfig" to mapOf(
				"temperature" to 0,
				"responseMimeType" to "application/json",
				"responseSchema" to schema,
			),
		)
		return restClient.post()
			.uri("https://$host/v1/projects/$project/locations/$location/publishers/google/models/$model:generateContent")
			.header("Authorization", "Bearer ${accessToken()}")
			.contentType(MediaType.APPLICATION_JSON)
			.body(request)
			.retrieve()
			.body<String>()!!
	}

	private fun metadata(path: String): String = restClient.get()
		.uri("http://metadata.google.internal/computeMetadata/v1/$path")
		.header("Metadata-Flavor", "Google")
		.retrieve()
		.body<String>()!!

	@Synchronized
	private fun accessToken(): String {
		val current = token
		if (current != null && Instant.now().isBefore(tokenExpiresAt)) return current
		val node = objectMapper.readTree(metadata("instance/service-accounts/default/token"))
		token = node.path("access_token").asText()
		tokenExpiresAt = Instant.now().plusSeconds(node.path("expires_in").asLong() - 60)
		return token!!
	}

	companion object {
		fun text(objectMapper: ObjectMapper, response: String): String =
			objectMapper.readTree(response).path("candidates").path(0).path("content").path("parts").path(0).path("text").asText()
	}
}
