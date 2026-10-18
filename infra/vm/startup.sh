#!/bin/bash
set -euo pipefail

if ! command -v docker >/dev/null; then
  apt-get update
  apt-get install -y docker.io docker-compose-v2
  systemctl enable --now docker
fi

mkdir -p /opt/ycc
metadata() { curl -sf -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/attributes/$1"; }
metadata compose > /opt/ycc/compose.prod.yaml
metadata caddyfile > /opt/ycc/Caddyfile
metadata deploy > /opt/ycc/deploy.sh
chmod +x /opt/ycc/deploy.sh

/opt/ycc/deploy.sh
