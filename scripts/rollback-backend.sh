#!/bin/bash

set -e

echo "===== Rollback Backend ====="

cd backend

if [ ! -f ".last-good-version" ]; then

    echo "❌ Aucune version précédente disponible"

    exit 1
fi

PREVIOUS_VERSION=$(cat .last-good-version)

if [ -z "$PREVIOUS_VERSION" ]; then

    echo "❌ La version précédente est vide"

    exit 1
fi

echo "🔄 Version à restaurer : $PREVIOUS_VERSION"

echo "🛑 Arrêt de la version défaillante..."

docker compose down

echo "🚀 Redémarrage avec : $PREVIOUS_VERSION"

IMAGE_TAG="$PREVIOUS_VERSION" docker compose up -d

echo "⏳ Vérification..."

sleep 30

echo "===== État des containers ====="

docker compose ps

if docker compose ps | grep -q "unhealthy\|Exited"; then

    echo "❌ Le rollback a échoué"

    exit 1
fi

echo "✅ Rollback Backend terminé"