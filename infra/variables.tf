variable "project_id" {
  type    = string
  default = "festivalwith"
}

variable "region" {
  type    = string
  default = "asia-northeast3"
}

variable "zone" {
  type    = string
  default = "asia-northeast3-a"
}

variable "machine_type" {
  type    = string
  default = "e2-small"
}

variable "billing_account" {
  type = string
}

variable "budget_krw" {
  type    = number
  default = 50000
}

variable "github_repository" {
  type    = string
  default = "yeong0jae/ycc"
}
