#!/bin/bash

set -e

echo "===== Déploiement Backend ====="

cd backend

docker compose up -d

echo "⏳ Attente du démarrage des services..."

sleep 30

echo "===== Vérification des containers ====="

if docker compose ps | grep -q "unhealthy\|Exited"; then
    echo "❌ Un container est unhealthy ou arrêté"
    docker compose ps
    exit 1
fi

echo "===== État des containers ====="

docker compose ps

echo "✅ Backend déployé avec succès"