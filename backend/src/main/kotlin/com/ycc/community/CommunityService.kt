package com.ycc.community

import com.ycc.notice.NoticeImageStorage
import com.ycc.notice.UploadedImage
import com.ycc.show.ReviewStatus
import com.ycc.show.ShowRepository
import com.ycc.user.User
import com.ycc.user.UserRepository
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Clock
import java.time.Duration
import java.time.LocalDateTime
import java.util.UUID

data class CommunityImageResponse(val id: Long, val url: String, val width: Int, val height: Int) {
	companion object {
		fun from(image: CommunityPostImage) = CommunityImageResponse(image.id, image.url, image.width, image.height)
	}
}

data class PostResponse(
	val id: Long,
	val showId: Long,
	val showName: String,
	val kind: PostKind,
	val body: String,
	val images: List<CommunityImageResponse>,
	val author: String,
	val authorAvatar: String?,
	val createdAt: LocalDateTime,
	val updatedAt: LocalDateTime?,
	val likeCount: Long,
	val commentCount: Long,
	val liked: Boolean,
	val mine: Boolean,
)

data class CommentResponse(
	val id: Long,
	val body: String,
	val author: String,
	val authorAvatar: String?,
	val createdAt: LocalDateTime,
	val updatedAt: LocalDateTime?,
	val mine: Boolean,
	val byPostAuthor: Boolean,
)

data class PostPageResponse(val items: List<PostResponse>, val hasMore: Boolean)

data class PostDetailResponse(val post: PostResponse, val comments: List<CommentResponse>)

data class PostRequest(val kind: PostKind, val body: String, val imageIds: List<Long> = emptyList())

data class CommentRequest(val body: String)

data class LikeRequest(val liked: Boolean)

data class LikeResponse(val liked: Boolean, val likeCount: Long)

data class ReportRequest(val reason: ReportReason)

@Service
@Transactional
class CommunityService(
	private val postRepository: CommunityPostRepository,
	private val imageRepository: CommunityPostImageRepository,
	private val commentRepository: CommunityCommentRepository,
	private val likeRepository: CommunityLikeRepository,
	private val reportRepository: CommunityReportRepository,
	private val userRepository: UserRepository,
	private val showRepository: ShowRepository,
	private val storage: NoticeImageStorage,
	private val clock: Clock,
) {

	@Transactional(readOnly = true)
	fun posts(showId: Long, kind: PostKind?, before: Long?, kakaoId: Long?): PostPageResponse {
		val viewer = kakaoId?.let(userRepository::findByKakaoId)
		val page = postRepository.findVisible(showId, kind, before, PageRequest.of(0, PAGE_SIZE + 1))
		return PostPageResponse(responses(page.take(PAGE_SIZE), viewer), page.size > PAGE_SIZE)
	}

	@Transactional(readOnly = true)
	fun feed(showIds: List<Long>?, kind: PostKind?, before: Long?, kakaoId: Long?): PostPageResponse {
		val viewer = kakaoId?.let(userRepository::findByKakaoId)
		val pageable = PageRequest.of(0, PAGE_SIZE + 1)
		val page = when {
			showIds == null -> postRepository.findFeedAll(kind, before, pageable)
			showIds.isEmpty() -> emptyList()
			else -> postRepository.findFeed(showIds.distinct().take(MAX_FEED_SHOWS), kind, before, pageable)
		}
		return PostPageResponse(responses(page.take(PAGE_SIZE), viewer), page.size > PAGE_SIZE)
	}

	@Transactional(readOnly = true)
	fun post(showId: Long, postId: Long, kakaoId: Long?): PostDetailResponse {
		val viewer = kakaoId?.let(userRepository::findByKakaoId)
		val post = visiblePost(showId, postId)
		val comments = commentRepository.findVisible(postId).map {
			CommentResponse(it.id, it.body, it.user.nickname.orEmpty(), it.user.avatarUrl, it.createdAt, it.updatedAt, it.user.id == viewer?.id, it.user.id == post.user.id)
		}
		return PostDetailResponse(responses(listOf(post), viewer).single(), comments)
	}

	fun create(kakaoId: Long, showId: Long, request: PostRequest): PostResponse {
		val user = member(kakaoId)
		val show = showRepository.findById(showId).orElse(null)?.takeIf { it.reviewStatus == ReviewStatus.VISIBLE }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
		val now = LocalDateTime.now(clock)
		if (postRepository.countByShowIdAndUserIdAndCreatedAtAfter(showId, user.id, now.minus(POST_INTERVAL)) > 0) {
			throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "잠시 뒤에 다시 올려 주세요.")
		}
		val post = postRepository.save(CommunityPost(show, user, request.kind, postBody(request.body), now))
		attachImages(post, user, request.imageIds)
		return responses(listOf(post), user).single()
	}

	fun update(kakaoId: Long, showId: Long, postId: Long, request: PostRequest): PostResponse {
		val user = member(kakaoId)
		val post = ownPost(showId, postId, user)
		post.kind = request.kind
		post.body = postBody(request.body)
		post.updatedAt = LocalDateTime.now(clock)
		attachImages(post, user, request.imageIds)
		return responses(listOf(post), user).single()
	}

	fun delete(kakaoId: Long, showId: Long, postId: Long) {
		val user = member(kakaoId)
		ownPost(showId, postId, user).deletedAt = LocalDateTime.now(clock)
	}

	fun uploadImage(kakaoId: Long, showId: Long, bytes: ByteArray, contentType: String?): CommunityImageResponse {
		val user = member(kakaoId)
		val image = UploadedImage.read(bytes, contentType)
		val key = "community/$showId/${UUID.randomUUID()}.${image.extension}"
		val url = storage.put(key, image.bytes, image.contentType)
		return CommunityImageResponse.from(
			imageRepository.save(CommunityPostImage(user, key, url, image.width, image.height, LocalDateTime.now(clock))),
		)
	}

	fun comment(kakaoId: Long, showId: Long, postId: Long, request: CommentRequest): CommentResponse {
		val user = member(kakaoId)
		val post = visiblePost(showId, postId)
		val now = LocalDateTime.now(clock)
		if (commentRepository.countByUserIdAndCreatedAtAfter(user.id, now.minus(COMMENT_INTERVAL)) > 0) {
			throw ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "잠시 뒤에 다시 남겨 주세요.")
		}
		val comment = commentRepository.save(CommunityComment(post, user, commentBody(request.body), now))
		return CommentResponse(comment.id, comment.body, user.nickname.orEmpty(), user.avatarUrl, comment.createdAt, null, true, user.id == post.user.id)
	}

	fun updateComment(kakaoId: Long, showId: Long, postId: Long, commentId: Long, request: CommentRequest): CommentResponse {
		val user = member(kakaoId)
		val comment = ownComment(showId, postId, commentId, user)
		comment.body = commentBody(request.body)
		comment.updatedAt = LocalDateTime.now(clock)
		return CommentResponse(comment.id, comment.body, user.nickname.orEmpty(), user.avatarUrl, comment.createdAt, comment.updatedAt, true, user.id == comment.post.user.id)
	}

	fun deleteComment(kakaoId: Long, showId: Long, postId: Long, commentId: Long) {
		val user = member(kakaoId)
		ownComment(showId, postId, commentId, user).deletedAt = LocalDateTime.now(clock)
	}

	fun like(kakaoId: Long, showId: Long, postId: Long, request: LikeRequest): LikeResponse {
		val user = member(kakaoId)
		val post = visiblePost(showId, postId)
		val existing = likeRepository.findByPostIdAndUserId(postId, user.id)
		if (request.liked && existing == null) likeRepository.save(CommunityLike(post, user, LocalDateTime.now(clock)))
		if (!request.liked && existing != null) likeRepository.delete(existing)
		likeRepository.flush()
		return LikeResponse(request.liked, likeRepository.countByPostId(postId))
	}

	fun reportPost(kakaoId: Long, showId: Long, postId: Long, request: ReportRequest) {
		val user = member(kakaoId)
		val post = visiblePost(showId, postId)
		if (report(ReportTarget.POST, postId, user, request.reason)) post.hiddenAt = LocalDateTime.now(clock)
	}

	fun reportComment(kakaoId: Long, showId: Long, postId: Long, commentId: Long, request: ReportRequest) {
		val user = member(kakaoId)
		visiblePost(showId, postId)
		val comment = commentRepository.findById(commentId).orElse(null)?.takeIf { it.post.id == postId && it.visible }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
		if (report(ReportTarget.COMMENT, commentId, user, request.reason)) comment.hiddenAt = LocalDateTime.now(clock)
	}

	fun deleteUnattachedImages() {
		imageRepository.findUnattachedBefore(LocalDateTime.now(clock).minus(UNATTACHED_TTL)).forEach {
			storage.delete(it.storageKey)
			imageRepository.delete(it)
		}
	}

	private fun report(type: ReportTarget, targetId: Long, user: User, reason: ReportReason): Boolean {
		if (reportRepository.existsByTargetTypeAndTargetIdAndUserId(type, targetId, user.id)) return false
		reportRepository.save(CommunityReport(type, targetId, user, reason, LocalDateTime.now(clock)))
		reportRepository.flush()
		return reportRepository.countByTargetTypeAndTargetIdAndResolvedAtIsNull(type, targetId) >= HIDE_AFTER_REPORTS
	}

	private fun responses(posts: List<CommunityPost>, viewer: User?): List<PostResponse> {
		if (posts.isEmpty()) return emptyList()
		val ids = posts.map { it.id }
		val images = imageRepository.findByPostIds(ids).groupBy { it.post!!.id }
		val likes = likeRepository.countByPosts(ids).associate { (it[0] as Long) to (it[1] as Long) }
		val comments = commentRepository.countVisible(ids).associate { (it[0] as Long) to (it[1] as Long) }
		val liked = viewer?.let { likeRepository.findLikedPostIds(it.id, ids).toSet() }.orEmpty()
		return posts.map {
			PostResponse(
				it.id,
				it.show.id,
				it.show.name,
				it.kind,
				it.body,
				images[it.id].orEmpty().map(CommunityImageResponse::from),
				it.user.nickname.orEmpty(),
				it.user.avatarUrl,
				it.createdAt,
				it.updatedAt,
				likes[it.id] ?: 0,
				comments[it.id] ?: 0,
				it.id in liked,
				it.user.id == viewer?.id,
			)
		}
	}

	private fun attachImages(post: CommunityPost, user: User, imageIds: List<Long>) {
		val ids = imageIds.distinct()
		if (ids.size > MAX_IMAGES) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "사진은 ${MAX_IMAGES}장까지 붙일 수 있어요.")
		val found = imageRepository.findAllById(ids).associateBy { it.id }
		val picked = ids.map { id ->
			found[id]?.takeIf { it.user.id == user.id && (it.post == null || it.post?.id == post.id) }
				?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "붙일 수 없는 사진이 있어요.")
		}
		imageRepository.findByPostIds(listOf(post.id)).filter { it !in picked }.forEach {
			storage.delete(it.storageKey)
			imageRepository.delete(it)
		}
		picked.forEachIndexed { index, image ->
			image.post = post
			image.position = index
		}
		imageRepository.flush()
	}

	private fun postBody(body: String): String {
		val text = body.trim()
		if (text.isEmpty() || text.length > MAX_POST) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "글은 1~${"%,d".format(MAX_POST)}자로 적어 주세요.")
		return text
	}

	private fun commentBody(body: String): String {
		val text = body.trim()
		if (text.isEmpty() || text.length > MAX_COMMENT) throw ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글은 1~${MAX_COMMENT}자로 적어 주세요.")
		return text
	}

	private fun member(kakaoId: Long): User = userRepository.findByKakaoId(kakaoId) ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)

	private fun visiblePost(showId: Long, postId: Long) =
		postRepository.findById(postId).orElse(null)?.takeIf { it.show.id == showId && it.visible }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)

	private fun ownPost(showId: Long, postId: Long, user: User): CommunityPost {
		val post = visiblePost(showId, postId)
		if (post.user.id != user.id) throw ResponseStatusException(HttpStatus.FORBIDDEN)
		return post
	}

	private fun ownComment(showId: Long, postId: Long, commentId: Long, user: User): CommunityComment {
		visiblePost(showId, postId)
		val comment = commentRepository.findById(commentId).orElse(null)?.takeIf { it.post.id == postId && it.visible }
			?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
		if (comment.user.id != user.id) throw ResponseStatusException(HttpStatus.FORBIDDEN)
		return comment
	}

	companion object {
		private const val PAGE_SIZE = 20
		private const val MAX_FEED_SHOWS = 200
		private const val MAX_POST = 1000
		private const val MAX_COMMENT = 300
		private const val MAX_IMAGES = 4
		private const val HIDE_AFTER_REPORTS = 3L
		private val POST_INTERVAL = Duration.ofMinutes(1)
		private val COMMENT_INTERVAL = Duration.ofSeconds(10)
		private val UNATTACHED_TTL = Duration.ofDays(1)
	}
}
