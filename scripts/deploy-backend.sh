#!/bin/bash

set -e

echo "===== Déploiement Backend ====="

if [ -z "$IMAGE_TAG" ]; then
    echo "❌ IMAGE_TAG n'est pas défini"
    exit 1
fi

echo "📦 Version à déployer : $IMAGE_TAG"

cd backend

docker compose up -d

# echo "⏳ Attente du démarrage des services..."

# sleep 30

# exit 1

echo "===== Vérification des containers ====="

if docker compose ps | grep -q "unhealthy\|Exited"; then

    echo "❌ Un container est unhealthy ou arrêté"

    docker compose ps

    exit 1
fi

echo "===== État des containers ====="

docker compose ps

echo "$IMAGE_TAG" > .last-good-version

echo "💾 Dernière version fonctionnelle : $IMAGE_TAG"

echo "✅ Backend déployé avec succès"
