# Multi-stage build for Node A
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Copy parent pom and shared module
COPY pom.xml .
COPY shared/ ./shared/
COPY node_a/ ./node_a/

# Build the project
RUN mvn clean package -DskipTests -pl node_a -am

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy built JAR from builder
COPY --from=builder /build/node_a/target/node_a-*.jar app.jar

# Create health check script
RUN echo '#!/bin/sh' > /app/health_check.sh && \
    echo 'curl -f http://localhost:5000/api/health || exit 1' >> /app/health_check.sh && \
    chmod +x /app/health_check.sh

EXPOSE 5000

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
