# Use Maven to build the project first
FROM maven:3.8.5-openjdk-17 AS builder

WORKDIR /app

# Copy everything
COPY . .

# Build the jar (adjust the profile if needed)
RUN mvn clean package -DskipTests

# Now use a smaller runtime image
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy only the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
