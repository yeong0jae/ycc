#!/bin/bash
set -euo pipefail
PROJECT=festivalwith
BUCKET=gs://festivalwith-tfstate

gcloud storage buckets describe "$BUCKET" >/dev/null 2>&1 ||
  gcloud storage buckets create "$BUCKET" --project "$PROJECT" --location asia-northeast3 --uniform-bucket-level-access
gcloud storage buckets update "$BUCKET" --versioning
