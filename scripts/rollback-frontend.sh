#!/bin/bash

set -e

echo "===== Rollback Frontend ====="

cd frontend

echo "🛑 Arrêt de la version défaillante..."

pkill -f "ng serve" || true

if [ ! -d "dist-previous" ]; then

    echo "⚠️ Aucun backup frontend disponible"

    exit 1

fi

echo "🔄 Restauration du build précédent..."

rm -rf dist

cp -r dist-previous dist

export JENKINS_NODE_COOKIE=dontKillMe

echo "🚀 Redémarrage de l'ancienne version..."

nohup npx ng serve \
    --ssl \
    --host 0.0.0.0 \
    --port 4200 \
    > ng-serve.log 2>&1 &

sleep 5

if pgrep -f "ng serve" > /dev/null; then

    echo "✅ Ancienne version Frontend restaurée"

else

    echo "❌ Impossible de relancer Angular"

    tail -50 ng-serve.log

    exit 1

fi