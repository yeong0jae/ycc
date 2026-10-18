#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
REGISTRY=$(terraform output -raw registry)
TAG=$(git rev-parse --short HEAD)

for service in backend frontend; do
  gcloud builds submit "../$service" --tag "$REGISTRY/$service:$TAG" --region asia-northeast3
  gcloud artifacts docker tags add "$REGISTRY/$service:$TAG" "$REGISTRY/$service:latest" --quiet
done

[ "${1:-}" = "--build-only" ] && exit 0

gcloud compute ssh ycc --zone asia-northeast3-a --tunnel-through-iap --command "sudo TAG=$TAG /opt/ycc/deploy.sh"
echo "deployed $TAG → $(terraform output -raw site_url)"
