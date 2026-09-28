bash
#!/bin/bash

set -e

echo "===== Rollback Backend ====="

cd backend

# ============================================================
# 1. Vérifier que la version actuelle existe
# ============================================================

if [ ! -f ".last-good-version" ]; then
    echo "❌ Aucune version actuellement déployée"
    exit 1
fi

CURRENT_VERSION=$(cat .last-good-version)

if [ -z "$CURRENT_VERSION" ]; then
    echo "❌ La version actuelle est vide"
    exit 1
fi

echo "📦 Version actuelle : $CURRENT_VERSION"


# ============================================================
# 2. Vérifier que la version précédente existe
# ============================================================

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


# ============================================================
# 3. Liste des services Backend
# ============================================================

SERVICES=(
    "api-gateway"
    "discovery-service"
    "media-service"
    "product-service"
    "security-service"
    "user-service"
)


# ============================================================
# 4. Vérifier que toutes les images existent
# ============================================================

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

echo "✅ Toutes les images de $PREVIOUS_VERSION sont disponibles"


# ============================================================
# 5. Arrêter la version actuelle
# ============================================================

echo "===== Arrêt de la version actuelle ====="

docker compose down


# ============================================================
# 6. Redémarrer avec la version précédente
# ============================================================

echo "===== Redémarrage avec $PREVIOUS_VERSION ====="

IMAGE_TAG="$PREVIOUS_VERSION" \
docker compose up -d --no-build --wait


# ============================================================
# 7. Vérifier l'état des containers
# ============================================================

echo "===== Vérification des containers ====="

docker compose ps

if docker compose ps | grep -q "unhealthy\|Exited"; then

    echo "❌ Le rollback a échoué"

    echo "===== État des containers ====="

    docker compose ps

    exit 1
fi


# ============================================================
# 8. Mettre à jour les versions
# ============================================================

echo "===== Mise à jour des versions ====="

# L'ancienne version actuelle devient la version précédente
echo "$CURRENT_VERSION" > .previous-version

# La version restaurée devient la version actuellement déployée
echo "$PREVIOUS_VERSION" > .last-good-version


# ============================================================
# 9. Afficher le résultat
# ============================================================

echo "===== Rollback terminé ====="

echo "📦 Ancienne version : $CURRENT_VERSION"
echo "🔄 Version restaurée : $PREVIOUS_VERSION"

echo ""
echo "📄 .last-good-version :"
cat .last-good-version

echo ""
echo "📄 .previous-version :"
cat .previous-version

echo ""
echo "===== État final ====="

docker compose ps

echo ""
echo "✅ Rollback Backend terminé avec succès"
echo "📦 Version restaurée : $PREVIOUS_VERSION"