#!/bin/bash

set -e

echo "===== Préparation des secrets ====="

# =========================
# Security Service
# =========================

mkdir -p backend/security-service/src/main/resources/certs

rm -f backend/security-service/src/main/resources/certs/pri.pem
rm -f backend/security-service/src/main/resources/certs/pub.pem

cp "$JWT_PRIVATE_KEY" \
   backend/security-service/src/main/resources/certs/pri.pem

cp "$JWT_PUBLIC_KEY" \
   backend/security-service/src/main/resources/certs/pub.pem


# =========================
# API Gateway
# =========================

mkdir -p backend/api-gateway/src/main/resources/certs

rm -f backend/api-gateway/src/main/resources/certs/pub.pem

cp "$JWT_PUBLIC_KEY" \
   backend/api-gateway/src/main/resources/certs/pub.pem


# =========================
# Media Service
# =========================

cat > backend/media-service/src/main/resources/env.properties <<EOF
CLOUDINARY_URL=$CLOUDINARY_URL
EOF


# =========================
# Frontend SSL
# =========================

mkdir -p frontend/certs

rm -f frontend/certs/nginx.crt
rm -f frontend/certs/nginx.key

cp "$FRONTEND_SSL_CERT" \
   frontend/certs/nginx.crt

cp "$FRONTEND_SSL_KEY" \
   frontend/certs/nginx.key


# =========================
# Vérification
# =========================

echo "===== Vérification ====="

test -f backend/security-service/src/main/resources/certs/pri.pem
echo "✅ security pri.pem OK"

test -f backend/security-service/src/main/resources/certs/pub.pem
echo "✅ security pub.pem OK"

test -f backend/api-gateway/src/main/resources/certs/pub.pem
echo "✅ gateway pub.pem OK"

test -f backend/media-service/src/main/resources/env.properties
echo "✅ media env.properties OK"

test -f frontend/certs/nginx.crt
echo "✅ frontend nginx.crt OK"

test -f frontend/certs/nginx.key
echo "✅ frontend nginx.key OK"

echo "===== Secrets prêts ====="