package com.ycc.auth

import org.springframework.boot.convert.DurationStyle
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.session.web.http.DefaultCookieSerializer

@Configuration
class SessionConfig {

	@Bean
	fun cookieSerializer(@Value("\${spring.session.timeout:30d}") timeout: String) = DefaultCookieSerializer().apply {
		setCookieMaxAge(DurationStyle.detectAndParse(timeout).toSeconds().toInt())
	}
}
