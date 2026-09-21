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

RESTORED=false

for SERVICE in "${SERVICES[@]}"; do
    IMAGE="backend-${SERVICE}"
    if docker image inspect "${IMAGE}:previous" > /dev/null 2>&1; then
        docker tag "${IMAGE}:previous" "${IMAGE}:latest"
        RESTORED=true
    else
        echo "⚠️ Aucune image ${IMAGE}:previous disponible — impossible de restaurer ce service"
    fi
done

if [ "$RESTORED" = false ]; then
    echo "❌ Aucune version précédente disponible — rollback impossible (premier déploiement)"
    exit 1
fi

echo "🚀 Redémarrage avec les anciennes images..."
docker compose up -d

echo "⏳ Vérification..."
sleep 30
docker compose ps

echo "✅ Rollback Backend terminé"