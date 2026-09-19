#!/bin/bash

set -e

SERVICES=(
    "api-gateway"
    "discovery-service"
    "media-service"
    "product-service"
    "security-service"
    "user-service"
)

echo "===== Rollback Backend ====="

cd backend

echo "🛑 Arrêt de la version défaillante..."

docker compose down

echo "===== Restauration des images précédentes ====="

for SERVICE in "${SERVICES[@]}"; do

    IMAGE="backend-${SERVICE}"

    echo "Restore : ${IMAGE}:previous → ${IMAGE}:latest"

    docker tag "${IMAGE}:previous" "${IMAGE}:latest" || true

done

echo "🚀 Redémarrage avec les anciennes images..."

docker compose up -d

echo "⏳ Vérification..."

sleep 30

docker compose ps

echo "✅ Rollback Backend terminé"