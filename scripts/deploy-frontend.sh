#!/bin/bash

set -e

echo "===== Déploiement Frontend ====="

cd frontend

echo "🛑 Arrêt de l'ancienne version Angular..."

pkill -f "ng serve" || true

export JENKINS_NODE_COOKIE=dontKillMe

echo "🚀 Démarrage de la nouvelle version Angular..."

nohup npx ng serve \
    --ssl \
    --host 0.0.0.0 \
    --port 4200 \
    > ng-serve.log 2>&1 &

sleep 5

if pgrep -f "ng serve" > /dev/null; then

    echo "✅ Angular fonctionne correctement"

else

    echo "❌ Angular ne fonctionne pas"

    echo "===== Angular logs ====="

    tail -50 ng-serve.log

    exit 1

fi