#!/bin/bash

set -e

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