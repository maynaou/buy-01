#!/bin/bash

set -e

echo "===== DEBUG ====="

whoami
id

echo "JWT_PRIVATE_KEY = $JWT_PRIVATE_KEY"
echo "JWT_PUBLIC_KEY  = $JWT_PUBLIC_KEY"

echo ""
echo "PRIVATE KEY:"
ls -l "$JWT_PRIVATE_KEY"

echo ""
echo "PUBLIC KEY:"
ls -l "$JWT_PUBLIC_KEY"

echo ""
echo "TEST READ:"

cat "$JWT_PRIVATE_KEY" > /dev/null
echo "✅ PRIVATE KEY lisible"

cat "$JWT_PUBLIC_KEY" > /dev/null
echo "✅ PUBLIC KEY lisible"

echo ""
echo "TEST DESTINATION:"

ls -ld backend/security-service/src/main/resources/certs

echo ""
echo "COPY:"

cp "$JWT_PRIVATE_KEY" \
   backend/security-service/src/main/resources/certs/pri.pem

cp "$JWT_PUBLIC_KEY" \
   backend/security-service/src/main/resources/certs/pub.pem

echo "✅ COPY OK"