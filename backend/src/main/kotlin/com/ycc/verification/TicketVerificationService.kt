package com.ycc.verification

import com.ycc.dev.DeveloperRepository
import com.ycc.notice.UploadedImage
import com.ycc.show.ReviewStatus
import com.ycc.show.ShowRepository
import com.ycc.user.User
import com.ycc.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

data class VerificationResponse(
	val showId: Long,
	val showName: String,
	val startDate: LocalDate,
	val endDate: LocalDate,
	val status: VerificationStatus,
	val rejectReason: RejectReason?,
) {
	companion object {
		fun from(verification: TicketVerification) = VerificationResponse(
			verification.show.id,
			verification.show.name,
			verification.show.startDate,
			verification.show.endDate,
			verification.status,
			verification.rejectReason,
		)
	}
}

data class DevVerificationResponse(
	val id: Long,
	val showId: Long,
	val showName: String,
	val startDate: LocalDate,
	val endDate: LocalDate,
	val venue: String,
	val nickname: String,
	val status: VerificationStatus,
	val rejectReason: RejectReason?,
	val hasImage: Boolean,
	val createdAt: LocalDateTime,
	val decidedAt: LocalDateTime?,
)

data class DevVerificationsResponse(val items: List<DevVerificationResponse>, val pending: Long)

enum class VerificationDecision { APPROVE, REJECT, REVOKE }

data class DecisionRequest(val decision: VerificationDecision, val reason: RejectReason? = null)

@Service
@Transactional
class TicketVerificationService(
	private val verificationRepository: TicketVerificationRepository,
	private val userRepository: UserRepository,
	private val showRepository: ShowRepository,
	private val developerRepository: DeveloperRepository,
	private val storage: VerificationImageStorage,
	private val privacyFinder: PrivacyFinder,
	private val clock: Clock,
) {

	private val log = LoggerFactory.getLogger(javaClass)

	@Transactional(readOnly = true)
	fun mine(kakaoId: Long): List<VerificationResponse> = verificationRepository.findMine(member(kakaoId).id).map(VerificationResponse::from)

	@Transactional(readOnly = true)
	fun find(user: User, showId: Long): TicketVerification? = verificationRepository.findByUserIdAndShowId(user.id, showId)

	fun submit(kakaoId: Long, showId: Long, bytes: ByteArray, contentType: String?): VerificationResponse {
		val user = member(kakaoId)
		val show = showRepository.findById(showId).orElse(null)?.takeIf { it.reviewStatus == ReviewStatus.VISIBLE }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
		val existing = verificationRepository.findByUserIdAndShowId(user.id, show.id)
		when (existing?.status) {
			VerificationStatus.APPROVED -> throw ResponseStatusException(HttpStatus.CONFLICT, "이미 예매 인증됐어요.")
			VerificationStatus.PENDING -> throw ResponseStatusException(HttpStatus.CONFLICT, "예매 인증을 확인하고 있어요.")
			else -> {}
		}
		val image = UploadedImage.read(bytes, contentType)
		val boxes = runCatching { privacyFinder.find(image.bytes, image.contentType) }
			.onFailure { log.warn("예매 캡처 가리기에 실패했어요", it) }
			.getOrElse { throw ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "잠시 뒤에 다시 올려 주세요.") }
		val masked = ImageMask.paint(image.bytes, boxes)
		val key = "verifications/${show.id}/${UUID.randomUUID()}.jpg"
		storage.put(key, masked, "image/jpeg")
		val now = LocalDateTime.now(clock)
		val verification = existing?.apply {
			status = VerificationStatus.PENDING
			imageKey = key
			imageWidth = image.width
			imageHeight = image.height
			createdAt = now
			rejectReason = null
			decidedAt = null
			developer = null
		} ?: verificationRepository.save(TicketVerification(user, show, VerificationStatus.PENDING, key, image.width, image.height, now))
		return VerificationResponse.from(verification)
	}

	@Transactional(readOnly = true)
	fun forReview(status: VerificationStatus?): DevVerificationsResponse {
		val items = verificationRepository.findForReview(status).map {
			DevVerificationResponse(
				it.id,
				it.show.id,
				it.show.name,
				it.show.startDate,
				it.show.endDate,
				it.show.venue,
				it.user.nickname.orEmpty(),
				it.status,
				it.rejectReason,
				it.imageKey != null,
				it.createdAt,
				it.decidedAt,
			)
		}
		return DevVerificationsResponse(if (status == null) items.reversed() else items, verificationRepository.countByStatus(VerificationStatus.PENDING))
	}

	@Transactional(readOnly = true)
	fun image(id: Long): ByteArray {
		val key = verificationRepository.findById(id).orElse(null)?.imageKey ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
		return storage.read(key)
	}

	fun decide(developerId: Long, id: Long, request: DecisionRequest) {
		val verification = verificationRepository.findById(id).orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND) }
		val expected = if (request.decision == VerificationDecision.REVOKE) VerificationStatus.APPROVED else VerificationStatus.PENDING
		if (verification.status != expected) throw ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 신청이에요.")
		verification.status = if (request.decision == VerificationDecision.APPROVE) VerificationStatus.APPROVED else VerificationStatus.REJECTED
		verification.rejectReason = when (request.decision) {
			VerificationDecision.APPROVE -> null
			VerificationDecision.REJECT -> request.reason ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "거절 사유를 골라 주세요.")
			VerificationDecision.REVOKE -> request.reason ?: RejectReason.OTHER
		}
		verification.decidedAt = LocalDateTime.now(clock)
		verification.developer = developerRepository.findById(developerId).orElse(null)
		dropImage(verification)
	}

	fun deleteFor(user: User) {
		val verifications = verificationRepository.findByUserId(user.id)
		verifications.forEach { it.imageKey?.let(storage::delete) }
		verificationRepository.deleteAll(verifications)
	}

	@Transactional(readOnly = true)
	fun approvedPairs(userIds: Collection<Long>, showIds: Collection<Long>): Set<Pair<Long, Long>> {
		if (userIds.isEmpty() || showIds.isEmpty()) return emptySet()
		return verificationRepository.findApprovedPairs(userIds.toSet(), showIds.toSet()).map { (it[0] as Long) to (it[1] as Long) }.toSet()
	}

	private fun dropImage(verification: TicketVerification) {
		verification.imageKey?.let(storage::delete)
		verification.imageKey = null
		verification.imageWidth = null
		verification.imageHeight = null
	}

	private fun member(kakaoId: Long): User = userRepository.findByKakaoId(kakaoId) ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
}
