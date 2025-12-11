@echo off
echo Запуск CampusFlow Full-Stack приложения...

echo.
echo ========================================
echo Запуск бэкенда на порту 8081...
echo ========================================
start "Backend" cmd /c "cd backend && mvnw.cmd spring-boot:run"

echo.
echo Ожидание запуска бэкенда...
timeout /t 10 /nobreak > nul

echo.
echo ========================================
echo Запуск фронтенда на порту 8080...
echo ========================================
start "Frontend" cmd /c "cd schedule-hub-uni-main && npm run dev"

echo.
echo ========================================
echo Приложение запускается...
echo ========================================
echo Бэкенд: http://localhost:8081
echo Фронтенд: http://localhost:8080
echo API документация: http://localhost:8081/h2-console
echo ========================================

pause 