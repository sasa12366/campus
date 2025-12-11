#!/bin/bash

# Скрипт для деплоя CampusFlow

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker не установлен!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose не установлен!"
        exit 1
    fi
    
    log_success "Все зависимости установлены"
}

# Проверка файла .env
check_env_file() {
    log_info "Проверка конфигурации..."
    
    if [ ! -f ".env" ]; then
        log_warning "Файл .env не найден!"
        log_info "Копирую env.example в .env..."
        cp env.example .env
        log_warning "ВАЖНО: Отредактируйте файл .env перед продолжением!"
        log_warning "Особенно измените пароли и секретные ключи!"
        read -p "Нажмите Enter после редактирования .env файла..."
    fi
    
    log_success "Конфигурация проверена"
}

# Сборка и запуск
deploy() {
    local profile=${1:-"default"}
    
    log_info "Начинаю деплой с профилем: $profile"
    
    # Останавливаем существующие контейнеры
    log_info "Остановка существующих контейнеров..."
    docker-compose down 2>/dev/null || true
    
    # Собираем образы
    log_info "Сборка Docker образов..."
    docker-compose build --no-cache
    
    # Запускаем сервисы
    if [ "$profile" = "production" ]; then
        log_info "Запуск в продакшен режиме..."
        docker-compose --profile production up -d
    elif [ "$profile" = "dev" ]; then
        log_info "Запуск в режиме разработки..."
        docker-compose -f docker-compose.dev.yml up -d
    else
        log_info "Запуск в стандартном режиме..."
        docker-compose up -d
    fi
    
    # Ждем запуска сервисов
    log_info "Ожидание запуска сервисов..."
    sleep 10
    
    # Проверяем статус
    log_info "Проверка статуса сервисов..."
    docker-compose ps
    
    log_success "Деплой завершен!"
}

# Проверка здоровья
health_check() {
    log_info "Проверка здоровья приложения..."
    
    # Проверяем frontend
    if curl -f http://localhost > /dev/null 2>&1; then
        log_success "Frontend доступен"
    else
        log_warning "Frontend недоступен"
    fi
    
    # Проверяем backend
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        log_success "Backend доступен"
    else
        log_warning "Backend недоступен"
    fi
    
    # Проверяем базу данных
    if docker-compose exec -T postgres pg_isready -U schedule_user -d schedule > /dev/null 2>&1; then
        log_success "База данных доступна"
    else
        log_warning "База данных недоступна"
    fi
}

# Показ логов
show_logs() {
    log_info "Показ логов приложения..."
    docker-compose logs -f
}

# Обновление
update() {
    log_info "Обновление приложения..."
    
    # Получаем последние изменения
    git pull origin main
    
    # Пересобираем и перезапускаем
    deploy $1
}

# Очистка
cleanup() {
    log_warning "Очистка системы..."
    
    # Останавливаем контейнеры
    docker-compose down
    
    # Удаляем неиспользуемые образы
    docker system prune -f
    
    log_success "Очистка завершена"
}

# Справка
show_help() {
    echo "🚀 CampusFlow Deploy Script"
    echo ""
    echo "Использование: $0 [КОМАНДА] [ОПЦИИ]"
    echo ""
    echo "Команды:"
    echo "  deploy [profile]  - Деплой приложения (default|dev|production)"
    echo "  update [profile]  - Обновление и передеплой"
    echo "  health            - Проверка здоровья сервисов"
    echo "  logs              - Показ логов"
    echo "  cleanup           - Очистка системы"
    echo "  help              - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 deploy                # Стандартный деплой"
    echo "  $0 deploy dev            # Деплой для разработки"
    echo "  $0 deploy production     # Продакшен деплой"
    echo "  $0 update production     # Обновление продакшена"
}

# Основная логика
main() {
    local command=${1:-"deploy"}
    local profile=${2:-"default"}
    
    case $command in
        "deploy")
            check_dependencies
            check_env_file
            deploy $profile
            health_check
            ;;
        "update")
            check_dependencies
            update $profile
            health_check
            ;;
        "health")
            health_check
            ;;
        "logs")
            show_logs
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Неизвестная команда: $command"
            show_help
            exit 1
            ;;
    esac
}

# Запуск
main "$@"
