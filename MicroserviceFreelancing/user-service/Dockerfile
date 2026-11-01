# Multi-stage Dockerfile for user-service
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /build

COPY pom.xml ./pom.xml
COPY user-service/pom.xml ./user-service/pom.xml
COPY project-service/pom.xml ./project-service/pom.xml

COPY user-service/src ./user-service/src
RUN mvn clean package -pl user-service -am -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/user-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
