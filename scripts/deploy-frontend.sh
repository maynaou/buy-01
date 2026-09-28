#!/bin/bash
set -e

echo "===== Déploiement Frontend ====="

cd frontend

pkill -f "ng serve" || true
export JENKINS_NODE_COOKIE=dontKillMe

nohup npx ng serve --ssl --host 0.0.0.0 --port 4200 > ng-serve.log 2>&1 &

echo "⏳ Attente du serveur..."

OK=false
for i in $(seq 1 30); do
    if curl -sk -o /dev/null https://localhost:4200; then
        OK=true
        break
    fi
    sleep 5
done

if [ "$OK" != "true" ]; then
    echo "❌ Le frontend ne répond pas"
    tail -50 ng-serve.log
    exit 1
fi

# On note le commit SEULEMENT si tout a réussi
git rev-parse HEAD > .last-good-commit

echo "✅ Frontend déployé"