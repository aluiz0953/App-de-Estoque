FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
# Cached separately so `mvn package` below only re-downloads deps when pom.xml changes.
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre
# PDFBox (magazine pages) renders through Java2D, which needs these on the slim JRE image.
RUN apt-get update && apt-get install -y --no-install-recommends fontconfig libfreetype6 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Djava.awt.headless=true", "-jar", "app.jar"]
