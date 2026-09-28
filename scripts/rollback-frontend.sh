#!/bin/bash
set -e

echo "===== Rollback Frontend ====="

cd frontend

if [ ! -s ".last-good-commit" ]; then
    echo "❌ Aucune version fonctionnelle connue — rollback impossible"
    exit 1
fi

COMMIT=$(cat .last-good-commit)
echo "🔄 Retour au commit : $COMMIT"

pkill -f "ng serve" || true

git checkout "$COMMIT" -- .
npm ci

export JENKINS_NODE_COOKIE=dontKillMe
nohup npx ng serve --ssl --host 0.0.0.0 --port 4200 > ng-serve.log 2>&1 &

OK=false
for i in $(seq 1 30); do
    if curl -sk -o /dev/null https://localhost:4200; then
        OK=true
        break
    fi
    sleep 5
done

if [ "$OK" != "true" ]; then
    echo "❌ Le rollback a échoué"
    tail -50 ng-serve.log
    exit 1
fi

echo "✅ Rollback terminé : $COMMIT"