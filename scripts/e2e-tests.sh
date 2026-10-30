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

e2e_username="e2e$(date +%s%3N)"
e2e_product_name="E2E Product $e2e_username"

cleanup_e2e_data() {
    test_status=$?
    trap - EXIT
    cd "$repo_root/backend"

    if ! docker compose exec -T mongodb sh -c \
        'mongosh --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --file /dev/stdin' <<MONGOSH
const username = "$e2e_username";
const productName = "$e2e_product_name";
const authDb = db.getSiblingDB("auth-db");
const authCollection = authDb.getCollection("auth");
const auth = authCollection.findOne({ username: username }, { _id: 1 });

db.getSiblingDB("product-db").getCollection("product").deleteMany({ name: productName });
db.getSiblingDB("user-db").getCollection("users").deleteMany({ username: username });

if (auth) {
    authDb.getCollection("refreshToken").deleteMany({ userId: String(auth._id) });
    authCollection.deleteMany({ _id: auth._id });
}
MONGOSH
    then
        echo "Failed to clean up E2E data for user $e2e_username" >&2
        if [ "$test_status" -eq 0 ]; then
            test_status=1
        fi
    fi

    exit "$test_status"
}

trap cleanup_e2e_data EXIT
E2E_USERNAME="$e2e_username" \
E2E_PRODUCT_NAME="$e2e_product_name" \
E2E_DOCKER_HOST_IP="$docker_host_ip" \
npm run e2e
