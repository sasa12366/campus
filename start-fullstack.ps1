Write-Host "Запуск CampusFlow Full-Stack приложения..." -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Запуск бэкенда на порту 8081..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Запуск бэкенда в новом окне
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\mvnw.cmd spring-boot:run"

Write-Host ""
Write-Host "Ожидание запуска бэкенда..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Запуск фронтенда на порту 8080..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Запуск фронтенда в новом окне
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\schedule-hub-uni-main'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Приложение запускается..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Бэкенд: http://localhost:8081" -ForegroundColor White
Write-Host "Фронтенд: http://localhost:8080" -ForegroundColor White
Write-Host "API документация: http://localhost:8081/h2-console" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 