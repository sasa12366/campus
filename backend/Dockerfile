# Используем официальный образ Eclipse Temurin JDK 17
FROM eclipse-temurin:17-jdk-jammy

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем Maven wrapper и pom.xml для кэширования зависимостей
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Даем права на выполнение mvnw
RUN chmod +x ./mvnw

# Скачиваем зависимости (кэшируемый слой)
RUN ./mvnw dependency:go-offline -B

# Копируем исходный код
COPY src ./src

# Собираем приложение
RUN ./mvnw clean package -DskipTests

# Создаем пользователя для безопасности
RUN addgroup --system spring && adduser --system spring --ingroup spring

# Создаем директории для uploads и data
RUN mkdir -p /app/uploads /app/data && \
    chown -R spring:spring /app

# Переключаемся на пользователя spring
USER spring:spring

# Открываем порт
EXPOSE 8080

# Запускаем приложение
CMD ["java", "-jar", "target/schedule-1.2.2-test.jar"]