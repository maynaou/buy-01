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

echo "===== Backup des images Docker ====="

for SERVICE in "${SERVICES[@]}"; do

    IMAGE="backend-${SERVICE}"

    echo "Backup : ${IMAGE}:latest → ${IMAGE}:previous"

    docker tag "${IMAGE}:latest" "${IMAGE}:previous"

done

echo "✅ Backup Docker terminé"


# =========================
# Frontend
# =========================

if [ -d "frontend/dist" ]; then

    echo "===== Backup Frontend ====="

    rm -rf frontend/dist-previous

    cp -r frontend/dist frontend/dist-previous

    echo "✅ Backup Frontend terminé"

else

    echo "⚠️ Aucun frontend/dist trouvé"

fi