package com.ycc.auth

import jakarta.servlet.http.Cookie
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseCookie
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.HttpStatusEntryPoint
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher
import java.net.URLDecoder

@Configuration
class SecurityConfig(
	@Value("\${app.frontend-url}") private val frontendUrl: String,
	private val kakaoOAuth2UserService: KakaoOAuth2UserService,
) {

	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		http
			.csrf { it.disable() }
			.requestCache { it.disable() }
			.authorizeHttpRequests {
				it.requestMatchers(
					"/api/me/**",
					"/api/logout",
				).authenticated()
				it.anyRequest().permitAll()
			}
			.exceptionHandling {
				it.defaultAuthenticationEntryPointFor(
					HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
					PathPatternRequestMatcher.withDefaults().matcher("/api/**"),
				)
			}
			.oauth2Login {
				it.userInfoEndpoint { endpoint -> endpoint.userService(kakaoOAuth2UserService) }
				it.successHandler { request, response, _ ->
					response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(NEXT_COOKIE, "").path("/").maxAge(0).build().toString())
					response.sendRedirect(frontendUrl + nextPath(request.cookies))
				}
				it.failureHandler { _, response, _ -> response.sendRedirect("$frontendUrl/me?error") }
			}
			.logout {
				it.logoutUrl("/api/logout")
				it.logoutSuccessHandler(HttpStatusReturningLogoutSuccessHandler())
			}
		return http.build()
	}

	private fun nextPath(cookies: Array<Cookie>?): String {
		val next = cookies?.firstOrNull { it.name == NEXT_COOKIE }?.value?.let { URLDecoder.decode(it, Charsets.UTF_8) }
		return next?.takeIf { it.startsWith("/") && !it.startsWith("//") && !it.contains('\\') } ?: "/me"
	}

	companion object {
		const val NEXT_COOKIE = "ycc_next"
	}
}
