package com.ycc.auth

import com.ycc.user.UserService
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.HttpStatusEntryPoint
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher

@Configuration
class SecurityConfig(
	@Value("\${app.frontend-url}") private val frontendUrl: String,
	private val userService: UserService,
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
					"/api/logs/**",
					"/api/feed/**",
					"/api/users/**",
					"/api/shows/*/me",
					"/api/shows/*/plan",
					"/api/shows/*/log/**",
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
				it.successHandler { _, response, authentication ->
					val user = userService.get((authentication.principal as OAuth2User).name.toLong())
					response.sendRedirect(frontendUrl + if (user.onboarded) "/" else "/onboarding")
				}
				it.failureHandler { _, response, _ -> response.sendRedirect("$frontendUrl/login?error") }
			}
			.logout {
				it.logoutUrl("/api/logout")
				it.logoutSuccessHandler(HttpStatusReturningLogoutSuccessHandler())
			}
		return http.build()
	}
}
