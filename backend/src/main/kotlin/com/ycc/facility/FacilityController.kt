package com.ycc.facility

import com.ycc.show.ShowKind
import com.ycc.show.ShowRepository
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Clock
import java.time.LocalDate

@RestController
@RequestMapping("/api/facilities")
class FacilityController(
	private val showRepository: ShowRepository,
	private val clock: Clock,
) {

	@GetMapping
	fun list(@RequestParam(defaultValue = "FESTIVAL") kind: ShowKind): List<FacilityResponse> =
		showRepository.findUpcomingWithFacility(LocalDate.now(clock), kind)
			.groupBy { it.facility!! }
			.mapNotNull { (facility, shows) ->
				val latitude = facility.latitude ?: return@mapNotNull null
				val longitude = facility.longitude ?: return@mapNotNull null
				FacilityResponse(
					id = facility.id,
					name = facility.name,
					address = facility.address,
					latitude = latitude,
					longitude = longitude,
					shows = shows.map(FacilityShowResponse::from),
				)
			}
}
