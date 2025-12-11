# Запуск бэкенда CampusFlow

## Быстрый запуск

1. **Откройте терминал в корневой папке проекта**

2. **Перейдите в папку бэкенда:**
```bash
cd backend
```

3. **Запустите бэкенд:**
```bash
./mvnw spring-boot:run
```

Или на Windows:
```bash
mvnw.cmd spring-boot:run
```

## Проверка запуска

Бэкенд должен запуститься на порту **8081**. Вы увидите сообщения в консоли:

```
Started ScheduleApplication in X.XXX seconds (JVM running for X.XXX)
```

## Проверка доступности

Откройте в браузере: http://localhost:8081/h2-console

Если страница открывается, бэкенд работает корректно.

## Возможные проблемы

### Порт 8081 занят
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8081
kill -9 <PID>
```

### Java не найдена
Убедитесь, что Java 17 или выше установлена:
```bash
java -version
```

### Maven не работает
Используйте встроенный Maven Wrapper:
```bash
# Linux/Mac
./mvnw clean compile

# Windows
mvnw.cmd clean compile
```

## Логи

Бэкенд выводит подробные логи в консоль. При возникновении ошибок обратите внимание на:
- Ошибки подключения к базе данных
- Ошибки валидации данных
- HTTP статусы запросов

## База данных

Используется H2 в файловом режиме:
- Файлы БД: `backend/data/schedule.*`
- H2 Console: http://localhost:8081/h2-console
- JDBC URL: `jdbc:h2:file:./data/schedule`
- User: `sa`
- Password: (пустой) 