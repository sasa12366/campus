Param(
  [string]$Registry = $env:REGISTRY
    ? $env:REGISTRY : "ghcr.io",
  [string]$Namespace = $env:IMAGE_NAMESPACE
    ? $env:IMAGE_NAMESPACE : "marselleze",
  [string]$BackendName = $env:IMAGE_BACKEND_NAME
    ? $env:IMAGE_BACKEND_NAME : "campusflow-backend",
  [string]$FrontendName = $env:IMAGE_FRONTEND_NAME
    ? $env:IMAGE_FRONTEND_NAME : "campusflow-frontend",
  [string]$Tag = $env:IMAGE_TAG
    ? $env:IMAGE_TAG : "latest"
)

$BackendImage = "$Registry/$Namespace/$BackendName:$Tag"
$FrontendImage = "$Registry/$Namespace/$FrontendName:$Tag"

Write-Host "🔧 Реестр:   $Registry"
Write-Host "👤 Namespace: $Namespace"
Write-Host "📦 Backend:  $BackendImage"
Write-Host "📦 Frontend: $FrontendImage"

# Подсказка по логину
Write-Host "ℹ️  Убедитесь, что вошли в реестр: docker login $Registry"

Write-Host "🛠  Сборка backend..."
docker build -t $BackendImage -f backend/Dockerfile backend

Write-Host "🛠  Сборка frontend..."
docker build -t $FrontendImage -f schedule-hub-uni-main/Dockerfile schedule-hub-uni-main

Write-Host "🚀 Публикация backend..."
docker push $BackendImage

Write-Host "🚀 Публикация frontend..."
docker push $FrontendImage

Write-Host "✅ Готово. Образы опубликованы."
