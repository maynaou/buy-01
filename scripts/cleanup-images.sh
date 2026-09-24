#!/bin/bash


set -e 
KEEP=5 

SERVICES=( 
         "api-gateway" 
         "discovery-service" 
         "media-service" 
         "product-service" 
         "security-service" 
         "user-service" ) 
echo "===== Docker Image Cleanup =====" 
echo "📦 Conservation des $KEEP dernières versions" 

for SERVICE in "${SERVICES[@]}"; 
     do IMAGE="backend-${SERVICE}" 
     echo "" 
     
     echo "===== $IMAGE =====" 
     
    IMAGES=$(docker images "$IMAGE" --format "{{.Repository}}:{{.Tag}}" 
           \  | grep -E ':build-[0-9]+$' 
           \ | sort -V) 
        COUNT=$(echo "$IMAGES" | grep -c . || true) 
        
    if [ "$COUNT" -le "$KEEP" ]; 
     then 
     echo "ℹ️ Seulement $COUNT versions trouvées" 
     echo "➡️ Rien à supprimer"
     continue 
     
    fi DELETE_COUNT=$((COUNT - KEEP)) 
     echo "📊 Versions trouvées : $COUNT" 
     echo "🗑️ Versions à supprimer : $DELETE_COUNT" 

     echo "$IMAGES" | head -n "$DELETE_COUNT" | while read -r IMAGE_TAG; do 
     echo "🗑️ Suppression : $IMAGE_TAG" 
     docker rmi "$IMAGE_TAG" || true 
         done 
     done 
         
         
    echo "" 
    echo "===== Cleanup terminé ====="