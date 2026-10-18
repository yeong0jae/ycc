package com.ycc.kopis

import com.ycc.facility.Facility
import com.ycc.show.Show
import org.w3c.dom.Element
import org.xml.sax.InputSource
import java.io.StringReader
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import javax.xml.parsers.DocumentBuilderFactory

data class KopisSummary(
	val kopisId: String,
	val name: String,
	val startDate: LocalDate,
	val endDate: LocalDate,
	val openRun: Boolean,
)

data class KopisDetail(
	val kopisId: String,
	val name: String,
	val startDate: LocalDate,
	val endDate: LocalDate,
	val venue: String,
	val area: String?,
	val facilityId: String?,
	val posterUrl: String,
	val ticketUrl: String?,
	val scheduleGuide: String?,
	val priceGuide: String?,
) {
	fun toShow() = Show(
		kopisId = kopisId,
		name = name.take(300),
		startDate = startDate,
		endDate = endDate,
		venue = venue.take(200),
		posterUrl = posterUrl,
		ticketUrl = ticketUrl,
		officialUrl = null,
		scheduleGuide = scheduleGuide?.take(500),
		priceGuide = priceGuide?.take(2000),
	)
}

data class KopisFacility(
	val kopisId: String,
	val name: String,
	val address: String?,
	val latitude: Double?,
	val longitude: Double?,
) {
	fun toFacility() = Facility(
		kopisId = kopisId,
		name = name.take(200),
		address = address?.take(300),
		latitude = latitude,
		longitude = longitude,
	)
}

object KopisParser {

	private val DATE = DateTimeFormatter.ofPattern("yyyy.MM.dd")

	fun parseList(xml: String): List<KopisSummary> =
		rows(xml).map {
			KopisSummary(
				kopisId = it.text("mt20id")!!,
				name = it.text("prfnm")!!,
				startDate = LocalDate.parse(it.text("prfpdfrom"), DATE),
				endDate = LocalDate.parse(it.text("prfpdto"), DATE),
				openRun = it.text("openrun") == "Y",
			)
		}

	fun parseDetail(xml: String): KopisDetail? {
		val db = rows(xml).firstOrNull() ?: return null
		val poster = db.text("poster") ?: return null
		return KopisDetail(
			kopisId = db.text("mt20id")!!,
			name = db.text("prfnm")!!,
			startDate = LocalDate.parse(db.text("prfpdfrom"), DATE),
			endDate = LocalDate.parse(db.text("prfpdto"), DATE),
			venue = db.text("fcltynm").orEmpty(),
			area = db.text("area"),
			facilityId = db.text("mt10id"),
			posterUrl = poster,
			ticketUrl = db.getElementsByTagName("relateurl").item(0)?.textContent?.trim()?.ifBlank { null },
			scheduleGuide = db.text("dtguidance"),
			priceGuide = db.text("pcseguidance"),
		)
	}

	fun parseFacility(xml: String): KopisFacility? {
		val db = rows(xml).firstOrNull() ?: return null
		return KopisFacility(
			kopisId = db.text("mt10id")!!,
			name = db.text("fcltynm")!!,
			address = db.text("adres"),
			latitude = db.text("la")?.toDoubleOrNull(),
			longitude = db.text("lo")?.toDoubleOrNull(),
		)
	}

	private fun rows(xml: String): List<Element> {
		val factory = DocumentBuilderFactory.newInstance()
		factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true)
		val document = factory.newDocumentBuilder().parse(InputSource(StringReader(xml)))
		val nodes = document.documentElement.getElementsByTagName("db")
		return (0 until nodes.length).map { nodes.item(it) as Element }
	}

	private fun Element.text(tag: String): String? =
		getElementsByTagName(tag).item(0)?.textContent?.trim()?.ifBlank { null }
}
