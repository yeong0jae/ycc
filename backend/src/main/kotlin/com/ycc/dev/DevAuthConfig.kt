package com.ycc.dev

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.servlet.HandlerInterceptor
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class DevAuthConfig : WebMvcConfigurer {

	@Bean
	fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

	override fun addInterceptors(registry: InterceptorRegistry) {
		registry.addInterceptor(
			object : HandlerInterceptor {
				override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
					if (request.getSession(false)?.getAttribute(DevAuthController.DEVELOPER_ID) != null) return true
					response.sendError(HttpStatus.UNAUTHORIZED.value())
					return false
				}
			},
		).addPathPatterns("/api/dev/**").excludePathPatterns("/api/dev/login")
	}
}
