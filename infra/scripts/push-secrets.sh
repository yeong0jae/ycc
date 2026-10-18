#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a
. ./.env
set +a

add() {
  printf '%s' "$2" | gcloud secrets versions add "$1" --data-file=- >/dev/null
  echo "$1 updated"
}

gcloud secrets versions access latest --secret db-password >/dev/null 2>&1 ||
  add db-password "$(openssl rand -base64 24 | tr -d '/+=')"
add kopis-api-key "$KOPIS_API_KEY"
add kakao-rest-api-key "$KAKAO_REST_API_KEY"
add kakao-client-secret "$KAKAO_CLIENT_SECRET"
add kakao-map-key "$KAKAO_MAP_KEY"
