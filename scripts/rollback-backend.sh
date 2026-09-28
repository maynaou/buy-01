#!/bin/bash
set -e

echo "===== Rollback Backend ====="

cd backend

if [ ! -s ".last-good-version" ]; then
    echo "❌ Aucune version fonctionnelle connue — rollback impossible"
    exit 1
fi

VERSION=$(cat .last-good-version)

echo "🔄 Retour à la version : $VERSION"

IMAGE_TAG="$VERSION" docker compose up -d --no-build --wait --wait-timeout 420

docker compose ps

echo "✅ Rollback terminé : $VERSION"