package com.ycc.community

import com.ycc.show.Show
import com.ycc.user.User
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDateTime

enum class PostKind { FREE, QUESTION, TIP, REVIEW, COMPANION }

enum class ReportReason { ABUSE, SPAM, PRIVACY, OTHER }

enum class ReportTarget { POST, COMMENT }

@Entity
@Table(name = "community_posts")
class CommunityPost(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "show_id")
	val show: Show,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	@Enumerated(EnumType.STRING)
	var kind: PostKind,
	var body: String,
	val createdAt: LocalDateTime,
	var updatedAt: LocalDateTime? = null,
	var deletedAt: LocalDateTime? = null,
	var hiddenAt: LocalDateTime? = null,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
) {
	@OneToMany(mappedBy = "post")
	@OrderBy("position")
	val images: MutableList<CommunityPostImage> = mutableListOf()

	val visible get() = deletedAt == null && hiddenAt == null
}

@Entity
@Table(name = "community_post_images")
class CommunityPostImage(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	val storageKey: String,
	val url: String,
	val width: Int,
	val height: Int,
	val createdAt: LocalDateTime,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "post_id")
	var post: CommunityPost? = null,
	var position: Int = 0,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

@Entity
@Table(name = "community_comments")
class CommunityComment(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "post_id")
	val post: CommunityPost,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	var body: String,
	val createdAt: LocalDateTime,
	var updatedAt: LocalDateTime? = null,
	var deletedAt: LocalDateTime? = null,
	var hiddenAt: LocalDateTime? = null,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
) {
	val visible get() = deletedAt == null && hiddenAt == null
}

@Entity
@Table(name = "community_likes")
class CommunityLike(
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "post_id")
	val post: CommunityPost,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	val createdAt: LocalDateTime,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

@Entity
@Table(name = "community_reports")
class CommunityReport(
	@Enumerated(EnumType.STRING)
	val targetType: ReportTarget,
	val targetId: Long,
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id")
	val user: User,
	@Enumerated(EnumType.STRING)
	val reason: ReportReason,
	val createdAt: LocalDateTime,
	var resolvedAt: LocalDateTime? = null,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface CommunityPostRepository : JpaRepository<CommunityPost, Long> {
	@Query(
		"select p from CommunityPost p join fetch p.user where p.show.id = :showId and p.deletedAt is null and p.hiddenAt is null" +
			" and (:kind is null or p.kind = :kind) and (:before is null or p.id < :before) order by p.id desc",
	)
	fun findVisible(showId: Long, kind: PostKind?, before: Long?, pageable: Pageable): List<CommunityPost>

	@Query(
		"select p from CommunityPost p join fetch p.user join fetch p.show s where s.id in :showIds and s.reviewStatus = com.ycc.show.ReviewStatus.VISIBLE" +
			" and p.deletedAt is null and p.hiddenAt is null and (:kind is null or p.kind = :kind) and (:before is null or p.id < :before) order by p.id desc",
	)
	fun findFeed(showIds: Collection<Long>, kind: PostKind?, before: Long?, pageable: Pageable): List<CommunityPost>

	@Query(
		"select p from CommunityPost p join fetch p.user join fetch p.show s where s.reviewStatus = com.ycc.show.ReviewStatus.VISIBLE" +
			" and p.deletedAt is null and p.hiddenAt is null and (:kind is null or p.kind = :kind) and (:before is null or p.id < :before) order by p.id desc",
	)
	fun findFeedAll(kind: PostKind?, before: Long?, pageable: Pageable): List<CommunityPost>

	fun countByShowIdAndUserIdAndCreatedAtAfter(showId: Long, userId: Long, after: LocalDateTime): Long
}

interface CommunityPostImageRepository : JpaRepository<CommunityPostImage, Long> {
	@Query("select i from CommunityPostImage i where i.post.id in :postIds order by i.position")
	fun findByPostIds(postIds: Collection<Long>): List<CommunityPostImage>

	@Query("select i from CommunityPostImage i where i.post is null and i.createdAt < :before")
	fun findUnattachedBefore(before: LocalDateTime): List<CommunityPostImage>
}

interface CommunityCommentRepository : JpaRepository<CommunityComment, Long> {
	@Query("select c from CommunityComment c join fetch c.user where c.post.id = :postId and c.deletedAt is null and c.hiddenAt is null order by c.id")
	fun findVisible(postId: Long): List<CommunityComment>

	@Query("select c.post.id, count(c) from CommunityComment c where c.post.id in :postIds and c.deletedAt is null and c.hiddenAt is null group by c.post.id")
	fun countVisible(postIds: Collection<Long>): List<Array<Any>>

	fun countByUserIdAndCreatedAtAfter(userId: Long, after: LocalDateTime): Long
}

interface CommunityLikeRepository : JpaRepository<CommunityLike, Long> {
	@Query("select l.post.id, count(l) from CommunityLike l where l.post.id in :postIds group by l.post.id")
	fun countByPosts(postIds: Collection<Long>): List<Array<Any>>

	@Query("select l.post.id from CommunityLike l where l.user.id = :userId and l.post.id in :postIds")
	fun findLikedPostIds(userId: Long, postIds: Collection<Long>): List<Long>

	fun findByPostIdAndUserId(postId: Long, userId: Long): CommunityLike?

	fun countByPostId(postId: Long): Long
}

interface CommunityReportRepository : JpaRepository<CommunityReport, Long> {
	fun existsByTargetTypeAndTargetIdAndUserId(targetType: ReportTarget, targetId: Long, userId: Long): Boolean

	fun countByTargetTypeAndTargetIdAndResolvedAtIsNull(targetType: ReportTarget, targetId: Long): Long

	fun findByResolvedAtIsNullOrderByIdDesc(): List<CommunityReport>

	fun findByTargetTypeAndTargetIdAndResolvedAtIsNull(targetType: ReportTarget, targetId: Long): List<CommunityReport>
}
