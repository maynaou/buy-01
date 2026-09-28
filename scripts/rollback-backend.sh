#!/bin/bash

set -e

echo "===== Rollback Backend ====="

cd backend

if [ ! -f ".previous-version" ]; then
    echo "❌ Aucune version précédente disponible"
    exit 1
fi

PREVIOUS_VERSION=$(cat .previous-version)

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "❌ La version précédente est vide"
    exit 1
fi

echo "🔄 Version à restaurer : $PREVIOUS_VERSION"

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

    IMAGE="backend-${SERVICE}:${PREVIOUS_VERSION}"

    if ! docker image inspect "$IMAGE" > /dev/null 2>&1; then
        echo "❌ Image absente : $IMAGE"
        echo "❌ Rollback impossible"
        exit 1
    fi

    echo "✅ $IMAGE"
done

echo "🛑 Arrêt de la version actuelle..."

docker compose down

echo "🚀 Redémarrage avec : $PREVIOUS_VERSION"

IMAGE_TAG="$PREVIOUS_VERSION" docker compose up -d --no-build --wait

echo "===== Vérification ====="

if docker compose ps | grep -q "unhealthy\|Exited"; then

    echo "❌ Le rollback a échoué"

    docker compose ps

    exit 1
fi

echo "$PREVIOUS_VERSION" > .last-good-version

echo "===== État des containers ====="

docker compose ps

echo "✅ Rollback Backend terminé"
echo "📦 Version restaurée : $PREVIOUS_VERSION"