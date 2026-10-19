data "google_project" "this" {}

locals {
  services = [
    "compute.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "iap.googleapis.com",
    "billingbudgets.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "oslogin.googleapis.com",
    "storage.googleapis.com",
  ]
  secrets      = ["db-password", "kopis-api-key", "kakao-rest-api-key", "kakao-client-secret", "kakao-map-key"]
  registry     = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.ycc.repository_id}"
  site_address = "${replace(google_compute_address.ycc.address, ".", "-")}.nip.io"
  build_sa     = "serviceAccount:${data.google_project.this.number}-compute@developer.gserviceaccount.com"
}

resource "google_project_service" "services" {
  for_each           = toset(local.services)
  service            = each.value
  disable_on_destroy = false
}

resource "google_compute_network" "ycc" {
  name                    = "ycc"
  auto_create_subnetworks = true
  depends_on              = [google_project_service.services]
}

resource "google_compute_firewall" "web" {
  name          = "ycc-allow-web"
  network       = google_compute_network.ycc.name
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["ycc-web"]

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
}

resource "google_compute_firewall" "iap_ssh" {
  name          = "ycc-allow-iap-ssh"
  network       = google_compute_network.ycc.name
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["ycc-web"]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_address" "ycc" {
  name       = "ycc"
  depends_on = [google_project_service.services]
}

resource "google_artifact_registry_repository" "ycc" {
  repository_id = "ycc"
  format        = "DOCKER"
  location      = var.region
  depends_on    = [google_project_service.services]

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each   = toset(local.secrets)
  secret_id  = each.value
  depends_on = [google_project_service.services]

  replication {
    auto {}
  }
}

data "google_secret_manager_secret_version" "db_password" {
  secret = google_secret_manager_secret.secrets["db-password"].secret_id
}

resource "google_sql_database_instance" "ycc" {
  name                = "ycc"
  database_version    = "MYSQL_8_4"
  deletion_protection = false
  depends_on          = [google_project_service.services]

  settings {
    tier                        = "db-f1-micro"
    edition                     = "ENTERPRISE"
    disk_type                   = "PD_SSD"
    disk_size                   = 10
    disk_autoresize             = true
    deletion_protection_enabled = false

    ip_configuration {
      ipv4_enabled = true
    }

    backup_configuration {
      enabled            = true
      binary_log_enabled = true
      start_time         = "19:00"
      backup_retention_settings {
        retained_backups = 7
      }
    }
  }
}

resource "google_sql_database" "ycc" {
  name      = "ycc"
  instance  = google_sql_database_instance.ycc.name
  charset   = "utf8mb4"
  collation = "utf8mb4_0900_ai_ci"
}

resource "google_sql_user" "ycc" {
  name     = "ycc"
  instance = google_sql_database_instance.ycc.name
  password = data.google_secret_manager_secret_version.db_password.secret_data
}

resource "google_service_account" "vm" {
  account_id   = "ycc-vm"
  display_name = "ycc VM"
}

resource "google_project_iam_member" "vm" {
  for_each = toset(["roles/artifactregistry.reader", "roles/secretmanager.secretAccessor", "roles/logging.logWriter", "roles/cloudsql.client"])
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.vm.email}"
}

resource "google_project_iam_member" "build" {
  for_each   = toset(["roles/artifactregistry.writer", "roles/logging.logWriter", "roles/storage.objectViewer"])
  project    = var.project_id
  role       = each.value
  member     = local.build_sa
  depends_on = [google_project_service.services]
}

resource "google_compute_instance" "ycc" {
  name         = "ycc"
  machine_type = var.machine_type
  tags         = ["ycc-web"]

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = 30
      type  = "pd-balanced"
    }
  }

  network_interface {
    network = google_compute_network.ycc.name
    access_config {
      nat_ip = google_compute_address.ycc.address
    }
  }

  service_account {
    email  = google_service_account.vm.email
    scopes = ["cloud-platform"]
  }

  shielded_instance_config {
    enable_secure_boot = true
  }

  metadata = {
    startup-script = file("${path.module}/vm/startup.sh")
    compose        = file("${path.module}/vm/compose.prod.yaml")
    caddyfile      = file("${path.module}/vm/Caddyfile")
    deploy         = file("${path.module}/vm/deploy.sh")
    registry       = local.registry
    site-address   = local.site_address
    sql-connection = google_sql_database_instance.ycc.connection_name
    notice-images  = google_storage_bucket.notice_images.name
    enable-oslogin = "TRUE"
  }

  depends_on = [google_project_iam_member.vm, google_secret_manager_secret.secrets, google_sql_user.ycc, google_sql_database.ycc]
}

resource "google_compute_resource_policy" "daily_snapshot" {
  name = "ycc-daily-snapshot"

  snapshot_schedule_policy {
    schedule {
      daily_schedule {
        days_in_cycle = 1
        start_time    = "19:00"
      }
    }
    retention_policy {
      max_retention_days    = 7
      on_source_disk_delete = "APPLY_RETENTION_POLICY"
    }
  }
}

resource "google_compute_disk_resource_policy_attachment" "daily_snapshot" {
  name = google_compute_resource_policy.daily_snapshot.name
  disk = google_compute_instance.ycc.name
}

resource "google_billing_budget" "monthly" {
  billing_account = var.billing_account
  display_name    = "ycc monthly"
  depends_on      = [google_project_service.services]

  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }

  amount {
    specified_amount {
      currency_code = "KRW"
      units         = tostring(var.budget_krw)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 1.0
  }
}

resource "google_storage_bucket" "notice_images" {
  name                        = "${var.project_id}-notice-images"
  location                    = var.region
  uniform_bucket_level_access = true
  depends_on                  = [google_project_service.services]
}

resource "google_storage_bucket_iam_member" "notice_images_public" {
  bucket = google_storage_bucket.notice_images.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "notice_images_vm" {
  bucket = google_storage_bucket.notice_images.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.vm.email}"
}
