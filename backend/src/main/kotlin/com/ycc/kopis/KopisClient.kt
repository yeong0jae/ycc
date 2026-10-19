package com.ycc.kopis

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.stereotype.Component
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.RestClient
import org.springframework.web.client.body
import java.net.http.HttpClient
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Component
class KopisClient(@Value("\${kopis.api-key:}") private val apiKey: String) {

	private val restClient = RestClient.builder()
		.baseUrl("http://www.kopis.or.kr/openApi/restful")
		.requestFactory(JdkClientHttpRequestFactory(HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).build()))
		.build()

	private var lastCalledAt = 0L

	val enabled: Boolean get() = apiKey.isNotBlank()

	fun fetchFestivals(from: LocalDate, to: LocalDate, page: Int, rows: Int): String =
		fetchList("/prffest", from, to, page, rows, null)

	fun fetchPerformances(from: LocalDate, to: LocalDate, page: Int, rows: Int, changedSince: LocalDate? = null): String =
		fetchList("/pblprfr", from, to, page, rows, changedSince)

	private fun fetchList(path: String, from: LocalDate, to: LocalDate, page: Int, rows: Int, changedSince: LocalDate?): String = call {
		restClient.get()
			.uri {
				it.path(path)
					.queryParam("service", apiKey)
					.queryParam("stdate", from.format(DATE))
					.queryParam("eddate", to.format(DATE))
					.queryParam("cpage", page)
					.queryParam("rows", rows)
					.queryParam("shcate", POPULAR_MUSIC)
					.queryParamIfPresent("afterdate", java.util.Optional.ofNullable(changedSince?.format(DATE)))
					.build()
			}
			.accept(MediaType.APPLICATION_XML)
			.retrieve()
			.body<ByteArray>()
	}

	fun fetchDetail(kopisId: String): String = call {
		restClient.get()
			.uri { it.path("/pblprfr/{id}").queryParam("service", apiKey).build(kopisId) }
			.accept(MediaType.APPLICATION_XML)
			.retrieve()
			.body<ByteArray>()
	}

	fun fetchFacility(facilityId: String): String = call {
		restClient.get()
			.uri { it.path("/prfplc/{id}").queryParam("service", apiKey).build(facilityId) }
			.accept(MediaType.APPLICATION_XML)
			.retrieve()
			.body<ByteArray>()
	}

	private fun call(request: () -> ByteArray?): String {
		var attempt = 1
		while (true) {
			throttle()
			try {
				return request()!!.toString(Charsets.UTF_8)
			} catch (e: HttpClientErrorException.BadRequest) {
				if (attempt >= MAX_ATTEMPTS) throw e
				Thread.sleep(RETRY_DELAY_MS * attempt++)
			}
		}
	}

	@Synchronized
	private fun throttle() {
		val wait = lastCalledAt + MIN_INTERVAL_MS - System.currentTimeMillis()
		if (wait > 0) Thread.sleep(wait)
		lastCalledAt = System.currentTimeMillis()
	}

	companion object {
		private const val MIN_INTERVAL_MS = 200L
		private const val MAX_ATTEMPTS = 5
		private const val RETRY_DELAY_MS = 1000L
		private val DATE = DateTimeFormatter.ofPattern("yyyyMMdd")
		private const val POPULAR_MUSIC = "CCCD"
	}
}
