# ── Estágio 1: Build ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copia os arquivos do Maven Wrapper e o pom.xml primeiro (cache de dependências)
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Baixa as dependências (camada cacheada enquanto o pom.xml não mudar)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copia o código-fonte e gera o JAR
COPY src ./src
RUN chmod +x mvnw && ./mvnw package -DskipTests -q

# ── Estágio 2: Runtime ────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copia apenas o JAR do estágio de build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

