#!/bin/bash

set -e

echo "===== Déploiement Backend ====="

if [ -z "$IMAGE_TAG" ]; then
    echo "❌ IMAGE_TAG n'est pas défini"
    exit 1
fi

echo "📦 Version à déployer : $IMAGE_TAG"

cd backend

SERVICES=(
    "api-gateway"
    "discovery-service"
    "media-service"
    "product-service"
    "security-service"
    "user-service"
)

echo "===== Vérification des images ====="

for SERVICE in "${SERVICES[@]}"; do

    IMAGE="backend-${SERVICE}:${IMAGE_TAG}"

    if ! docker image inspect "$IMAGE" > /dev/null 2>&1; then
        echo "❌ Image absente : $IMAGE"
        echo "❌ Déploiement annulé"
        exit 1
    fi

    echo "✅ $IMAGE"
done

echo "===== Toutes les images sont disponibles ====="

docker compose up -d --no-build --wait

echo "===== Vérification des containers ====="

if docker compose ps | grep -q "unhealthy\|Exited"; then

    echo "❌ Un container est unhealthy ou arrêté"

    docker compose ps

    exit 1
fi

echo "===== État des containers ====="

docker compose ps

CURRENT_VERSION=$(cat .last-good-version 2>/dev/null || true)

if [ -n "$CURRENT_VERSION" ]; then
    echo "$CURRENT_VERSION" > .previous-version
fi

# echo "$IMAGE_TAG" > .last-good-version

echo "$IMAGE_TAG" > .last-good-version

echo "💾 Version actuellement déployée : $IMAGE_TAG"

echo "✅ Backend déployé avec succès"