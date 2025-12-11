#!/bin/bash
set -euo pipefail

# Конфигурация по умолчанию (можно переопределить переменными окружения)
REGISTRY=${REGISTRY:-ghcr.io}
NAMESPACE=${IMAGE_NAMESPACE:-marselleze}
BACKEND_NAME=${IMAGE_BACKEND_NAME:-campusflow-backend}
FRONTEND_NAME=${IMAGE_FRONTEND_NAME:-campusflow-frontend}
TAG=${IMAGE_TAG:-latest}

BACKEND_IMAGE="$REGISTRY/$NAMESPACE/$BACKEND_NAME:$TAG"
FRONTEND_IMAGE="$REGISTRY/$NAMESPACE/$FRONTEND_NAME:$TAG"

echo "🔧 Реестр:   $REGISTRY"
echo "👤 Namespace: $NAMESPACE"
echo "📦 Backend:  $BACKEND_IMAGE"
echo "📦 Frontend: $FRONTEND_IMAGE"

# Проверка логина
if ! docker info | grep -qi "$REGISTRY"; then
  echo "ℹ️  Убедитесь, что вошли в реестр: docker login $REGISTRY"
fi

# Сборка образов
echo "🛠  Сборка backend..."
docker build -t "$BACKEND_IMAGE" -f backend/Dockerfile backend

echo "🛠  Сборка frontend..."
docker build -t "$FRONTEND_IMAGE" -f schedule-hub-uni-main/Dockerfile schedule-hub-uni-main

# Публикация
echo "🚀 Публикация backend..."
docker push "$BACKEND_IMAGE"

echo "🚀 Публикация frontend..."
docker push "$FRONTEND_IMAGE"

echo "✅ Готово. Образы опубликованы."
