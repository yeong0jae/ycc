package com.ycc.dev

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.springframework.data.jpa.repository.JpaRepository

@Entity
@Table(name = "developers")
class Developer(
	val username: String,
	val passwordHash: String,
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	val id: Long = 0,
)

interface DeveloperRepository : JpaRepository<Developer, Long> {
	fun findByUsername(username: String): Developer?
}
