#!/bin/bash
set -euo pipefail
cd /opt/ycc

metadata() { curl -sf -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/$1"; }
TOKEN=$(metadata "instance/service-accounts/default/token" | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')
PROJECT=$(metadata "project/project-id")
REGISTRY=$(metadata "instance/attributes/registry")
SITE_ADDRESS=$(metadata "instance/attributes/site-address")
SQL_CONNECTION_NAME=$(metadata "instance/attributes/sql-connection")
NOTICE_IMAGE_BUCKET=$(metadata "instance/attributes/notice-images")
metadata "instance/attributes/compose" > compose.prod.yaml
metadata "instance/attributes/caddyfile" > Caddyfile

secret() {
  curl -sf -H "Authorization: Bearer $TOKEN" \
    "https://secretmanager.googleapis.com/v1/projects/$PROJECT/secrets/$1/versions/latest:access" |
    python3 -c 'import base64,json,sys; print(base64.b64decode(json.load(sys.stdin)["payload"]["data"]).decode())'
}

CURRENT_TAG=$(grep -s '^TAG=' .env | cut -d= -f2 || true)
TAG=${TAG:-${CURRENT_TAG:-latest}}

umask 077
cat > .env <<ENV
REGISTRY=$REGISTRY
TAG=$TAG
SITE_ADDRESS=$SITE_ADDRESS
SQL_CONNECTION_NAME=$SQL_CONNECTION_NAME
NOTICE_IMAGE_BUCKET=$NOTICE_IMAGE_BUCKET
DB_PASSWORD=$(secret db-password)
KOPIS_API_KEY=$(secret kopis-api-key)
KAKAO_REST_API_KEY=$(secret kakao-rest-api-key)
KAKAO_CLIENT_SECRET=$(secret kakao-client-secret)
KAKAO_MAP_KEY=$(secret kakao-map-key)
ENV

echo "$TOKEN" | docker login -u oauth2accesstoken --password-stdin "https://${REGISTRY%%/*}" >/dev/null
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d --remove-orphans
docker image prune -f >/dev/null
