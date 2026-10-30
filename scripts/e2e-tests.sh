#!/usr/bin/env bash
set -eu

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
image_tag="${IMAGE_TAG:-latest}"

cd "$repo_root/backend"
IMAGE_TAG="$image_tag" docker compose up --no-build -d --wait --wait-timeout 420

attempts=0
status=000
while [ "$attempts" -lt 60 ]; do
    status=$(curl --silent --insecure --max-time 1 \
        --output /dev/null --write-out '%{http_code}' \
        --request POST --header 'Content-Type: application/json' \
        --data '{}' \
        https://docker:8888/api/auth/register 2>/dev/null || true)
    if [ "$status" = 400 ]; then
        break
    fi

    attempts=$((attempts + 1))
    if [ "$((attempts % 10))" -eq 0 ]; then
        echo "Waiting for auth route through API Gateway (attempt $attempts/60, HTTP $status)"
    fi
    sleep 1
done

if [ "$status" != 400 ]; then
    echo "Auth route did not become ready through the API Gateway within 2 minutes (expected HTTP 400, got $status)"
    exit 1
fi

cd "$repo_root/frontend"
IMAGE_TAG="$image_tag" docker compose up --no-build -d --wait --wait-timeout 420

docker_host_ip=$(getent hosts docker | awk 'NR == 1 { print $1 }')
if [ -z "$docker_host_ip" ]; then
    echo "Could not resolve Docker host 'docker' for Playwright"
    exit 1
fi

E2E_DOCKER_HOST_IP="$docker_host_ip" npm run e2e
