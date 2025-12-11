#!/bin/bash

# Скрипт для восстановления базы данных CampusFlow из резервной копии

set -e

# Конфигурация
CONTAINER_NAME="campusflow-postgres"
DB_NAME="schedule"
DB_USER="schedule_user"

# Проверяем аргументы
if [ $# -eq 0 ]; then
    echo "❌ Использование: $0 <backup_file.sql.gz>"
    echo "Пример: $0 ./backups/campusflow_backup_20241201_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1

# Проверяем существование файла
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Файл резервной копии не найден: $BACKUP_FILE"
    exit 1
fi

# Проверяем, что контейнер запущен
if ! docker ps | grep -q $CONTAINER_NAME; then
    echo "❌ Контейнер $CONTAINER_NAME не запущен!"
    echo "Запустите приложение: docker-compose up -d"
    exit 1
fi

echo "⚠️  ВНИМАНИЕ: Это действие полностью заменит текущую базу данных!"
echo "📁 Файл для восстановления: $BACKUP_FILE"
echo "🗄️ База данных: $DB_NAME"

# Запрашиваем подтверждение
read -p "Продолжить? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Восстановление отменено"
    exit 1
fi

echo "🔄 Восстановление базы данных..."

# Создаем резервную копию текущей базы (на всякий случай)
CURRENT_BACKUP="./backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
echo "💾 Создание резервной копии текущей базы данных..."
mkdir -p ./backups
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > $CURRENT_BACKUP
gzip $CURRENT_BACKUP
echo "✅ Резервная копия создана: $CURRENT_BACKUP.gz"

# Очищаем базу данных
echo "🗑️ Очистка текущей базы данных..."
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE;"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "CREATE SCHEMA public;"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO public;"

# Восстанавливаем из резервной копии
echo "📦 Восстановление из резервной копии..."
gunzip -c $BACKUP_FILE | docker exec -i $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME

echo "✅ База данных восстановлена успешно!"
echo "🎉 Восстановление завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте работу приложения"
echo "2. При необходимости перезапустите сервисы: docker-compose restart"
