# 🐳 Docker Деплой CampusFlow

## Требования к системе

- **Docker Desktop** 20.10+ (Windows/Mac/Linux)
- **Docker Compose** v2.0+
- **Минимум 10 GB** свободного места на диске
- **Минимум 4 GB RAM** для Docker

## Быстрый старт

### Режим разработки (с hot-reload)

```bash
# Остановить локальный PostgreSQL если запущен
Stop-Service -Name postgresql* -Force  # Windows
# или
sudo systemctl stop postgresql  # Linux

# Запустить все сервисы
docker-compose -f docker-compose.dev.yml up -d --build

# Проверить статус
docker ps

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f

# Открыть в браузере
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api/v1/faculty
```

### Режим продакшена

```bash
# Запустить все сервисы
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Открыть в браузере
# Frontend: http://localhost
# Backend API: http://localhost:8080/api/v1/faculty
```

## Архитектура

### Сервисы

1. **PostgreSQL** (порт 5432)
   - База данных schedule
   - Автоматическая инициализация через `init.sql`
   - Persistent volume для данных

2. **Backend Spring Boot** (порт 8080)
   - Java 17 (Eclipse Temurin)
   - Maven сборка
   - JWT аутентификация
   - REST API

3. **Frontend React** (порт 3000 dev / 80 prod)
   - Node.js 18 (dev)
   - Nginx (prod)
   - Vite dev server с hot-reload (dev)
   - Статичная сборка (prod)

### Volumes

- `postgres_data` / `postgres_data_dev` - данные PostgreSQL
- `backend_uploads` / `backend_uploads_dev` - загруженные файлы
- `backend_data` / `backend_data_dev` - данные приложения

## Управление контейнерами

### Основные команды

```bash
# Запуск
docker-compose -f docker-compose.dev.yml up -d

# Остановка
docker-compose -f docker-compose.dev.yml down

# Перезапуск отдельного сервиса
docker-compose -f docker-compose.dev.yml restart backend

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f backend
docker logs campusflow-backend-dev --tail 100

# Выполнение команд внутри контейнера
docker exec -it campusflow-backend-dev sh
docker exec -it campusflow-postgres-dev psql -U schedule_user -d schedule

# Проверка состояния
docker ps
docker stats
```

### Пересборка образов

```bash
# Полная пересборка без кеша
docker-compose -f docker-compose.dev.yml build --no-cache

# Пересборка конкретного сервиса
docker-compose -f docker-compose.dev.yml build frontend
```

## Решение проблем

### Порты заняты

**Проблема:** `Error: port is already allocated`

**Решение:**
```bash
# Windows
netstat -ano | findstr ":3000 :5432 :8080"
Stop-Service -Name postgresql* -Force

# Linux/Mac
lsof -i :3000
sudo systemctl stop postgresql
```

### Нехватка памяти

**Проблема:** `Out of memory` при сборке

**Решение:**
- Docker Desktop → Settings → Resources → Memory → увеличить до 4+ GB

### Backend не запускается

**Проблема:** Backend падает при старте

**Решение:**
```bash
# Проверить логи
docker logs campusflow-backend-dev

# Проверить подключение к базе
docker exec campusflow-backend-dev curl -s http://localhost:8080/api/v1/faculty
```

### Frontend не собирается

**Проблема:** Ошибки при сборке frontend

**Решение:**
```bash
# Очистить node_modules
docker-compose -f docker-compose.dev.yml down
docker volume rm campusflow_frontend_node_modules

# Пересобрать
docker-compose -f docker-compose.dev.yml build --no-cache frontend
```

### CORS ошибки

**Проблема:** `CORS policy: No 'Access-Control-Allow-Origin'`

**Решение:**
- Проверить что `backend/src/main/java/org/ksu/schedule/config/CorsConfig.java` включает нужный origin
- Проверить что в `SecurityConfig.java` есть `.cors(Customizer.withDefaults())`

## Backup и восстановление

### Backup базы данных

```bash
# Создать backup
docker exec campusflow-postgres-dev pg_dump -U schedule_user schedule > backup.sql

# Или через volume
docker run --rm -v campusflow_postgres_data:/data -v ${PWD}:/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### Восстановление

```bash
# Из SQL файла
docker exec -i campusflow-postgres-dev psql -U schedule_user schedule < backup.sql

# Из volume
docker run --rm -v campusflow_postgres_data:/data -v ${PWD}:/backup alpine sh -c "tar xzf /backup/postgres_backup.tar.gz -C /data"
```

## Оптимизация

### Уменьшение размера образов

**Текущие размеры:**
- Backend: ~600 MB (Java + Maven зависимости)
- Frontend (prod): ~50 MB (Nginx + статика)
- PostgreSQL: ~200 MB

**Multi-stage build** уже используется для frontend для минимизации размера продакшен образа.

### Кэширование

Docker Compose автоматически кэширует слои:
- Maven зависимости
- npm модули
- Build артефакты

Для очистки кеша:
```bash
docker system prune -a
docker builder prune
```

## Безопасность

### Переменные окружения

Для продакшена **обязательно изменить**:

1. В `docker-compose.yml`:
   ```yaml
   POSTGRES_PASSWORD: your-secure-password-here
   JWT_SECRET: your-long-random-secret-key-here
   SPRING_MAIL_PASSWORD: your-email-app-password
   ```

2. Использовать файл `.env`:
   ```bash
   # .env
   POSTGRES_PASSWORD=...
   JWT_SECRET=...
   ```
   
   И в docker-compose.yml:
   ```yaml
   environment:
     JWT_SECRET: ${JWT_SECRET}
   ```

### Безопасные практики

- ✅ Backend не запускается от root (пользователь `spring`)
- ✅ CORS настроен для конкретных origins
- ✅ Volumes изолированы
- ✅ Health checks для мониторинга

## Мониторинг

### Проверка здоровья

```bash
# Статус всех контейнеров
docker ps

# Использование ресурсов
docker stats

# Health checks
docker inspect campusflow-backend-dev | grep -A 10 Health
```

### Логи

```bash
# Все логи
docker-compose logs

# Конкретный сервис
docker-compose logs -f backend

# Последние 100 строк
docker logs campusflow-backend-dev --tail 100

# Следить за логами в реальном времени
docker logs -f campusflow-backend-dev
```

## Производительность

### JVM настройки (продакшен)

```yaml
JAVA_OPTS: "-Xmx2g -Xms1g -XX:+UseG1GC -XX:+UseStringDeduplication"
```

### PostgreSQL оптимизации

```yaml
shared_buffers: 256MB
effective_cache_size: 1GB
max_connections: 200
```

### Resource limits

```yaml
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '1.0'
    reservations:
      memory: 1G
      cpus: '0.5'
```

## Известные проблемы и решения

### 1. openjdk:17-jdk-slim not found

**Исправлено:** Использован `eclipse-temurin:17-jdk-jammy`

### 2. Liquibase foreign key ошибка в dev режиме

**Исправлено:** Liquibase отключен в dev, используется Hibernate DDL auto-update

### 3. Vite порт несоответствие

**Исправлено:** `vite.config.ts` настроен на порт 3000

### 4. CORS блокировка

**Исправлено:** Добавлен `.cors(Customizer.withDefaults())` в `SecurityConfig.java`

## Дополнительная информация

### Структура проектов

```
campusflow/
├── backend/
│   ├── Dockerfile          # Продакшен
│   ├── Dockerfile.dev      # Разработка
│   └── src/
├── schedule-hub-uni-main/
│   ├── Dockerfile          # Продакшен (Nginx)
│   ├── Dockerfile.dev      # Разработка (Vite)
│   ├── nginx.conf          # Nginx конфигурация
│   └── src/
├── docker-compose.yml      # Базовая конфигурация
├── docker-compose.dev.yml  # Разработка
└── docker-compose.prod.yml # Продакшен
```

### Порты

| Сервис | Dev | Prod |
|--------|-----|------|
| Frontend | 3000 | 80 |
| Backend | 8080 | 8080 |
| PostgreSQL | 5432 | 5432 |

### Переменные окружения

**Backend основные:**
- `SPRING_DATASOURCE_URL` - URL базы данных
- `JWT_SECRET` - Секретный ключ JWT
- `CORS_ALLOWED_ORIGINS` - Разрешенные origins
- `SPRING_PROFILES_ACTIVE` - Активный профиль (dev/docker/prod)

**Frontend:**
- `VITE_API_URL` - URL backend API для прокси

## Тестирование

### Функциональные тесты

1. **Регистрация/Авторизация**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"firstName":"Test","lastName":"User","middleName":"T","email":"test@test.com","password":"test123","role":"STUDENT"}'
   ```

2. **Получение данных**
   ```bash
   curl http://localhost:8080/api/v1/faculty
   curl http://localhost:8080/api/v1/schedule
   ```

3. **Аутентификация**
   ```bash
   curl -X POST http://localhost:8080/api/v1/auth/authenticate \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   ```

### Performance тесты

```bash
# Нагрузочное тестирование (требует Apache Bench)
ab -n 1000 -c 10 http://localhost:8080/api/v1/faculty
```

## Полезные ссылки

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Spring Boot Docker Guide](https://spring.io/guides/topicals/spring-boot-docker)
- [Nginx Documentation](https://nginx.org/ru/docs/)

