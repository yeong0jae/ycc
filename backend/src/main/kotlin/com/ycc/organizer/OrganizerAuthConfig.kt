package com.ycc.organizer

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.web.servlet.HandlerInterceptor
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class OrganizerAuthConfig(private val organizerRepository: OrganizerRepository) : WebMvcConfigurer {

	override fun addInterceptors(registry: InterceptorRegistry) {
		registry.addInterceptor(
			object : HandlerInterceptor {
				override fun preHandle(request: HttpServletRequest, response: HttpServletResponse, handler: Any): Boolean {
					val session = request.getSession(false)
					val organizerId = session?.getAttribute(OrganizerController.ORGANIZER_ID) as Long?
					if (organizerId != null && organizerRepository.findById(organizerId).map { it.active }.orElse(false)) return true
					session?.removeAttribute(OrganizerController.ORGANIZER_ID)
					response.sendError(HttpStatus.UNAUTHORIZED.value())
					return false
				}
			},
		).addPathPatterns("/api/organizer/**").excludePathPatterns("/api/organizer/login")
	}
}
