# EMS Backend - NQMS Fiber Monitoring

## Overview

Element Management System (EMS) backend for NQMS Fiber monitoring system. Built with Spring Boot 3.2 and MongoDB Atlas.

## Features

- **Alarm Management**: Receive, store, and manage alarms from RTUs
- **Real-time KPIs**: Calculate and track network health metrics
- **WebSocket Support**: Real-time updates for alarms and KPIs
- **RESTful API**: Comprehensive APIs for all operations
- **MongoDB Atlas**: Cloud-native database with flexible schema
- **Swagger/OpenAPI**: Auto-generated API documentation

## Technology Stack

- Java 17
- Spring Boot 3.2.2
- Spring Data MongoDB
- Spring WebSocket (STOMP)
- Lombok
- Swagger/OpenAPI
- Maven

## Prerequisites

- Java 17+
- Maven 3.8+
- MongoDB Atlas account
- Docker (optional)

## Configuration

Create `.env` file or set environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nqms_fiber_monitoring?retryWrites=true&w=majority
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Create a database named `nqms_fiber_monitoring`
4. Create a database user with read/write permissions
5. Whitelist your IP address or use 0.0.0.0/0 for development
6. Copy the connection string and update `MONGODB_URI`

## Running Locally

```bash
# Build
mvn clean package

# Run
java -jar target/ems-backend-1.0.0.jar

# Or with Maven
mvn spring-boot:run
```

## Running with Docker

```bash
# Build image
docker build -t nqms-ems-backend .

# Run container
docker run -p 8080:8080 \
  -e MONGODB_URI="your_mongodb_uri" \
  nqms-ems-backend
```

## API Documentation

Access Swagger UI at: `http://localhost:8080/swagger-ui.html`

### Main Endpoints

- `POST /api/alarms` - Create new alarm
- `GET /api/alarms` - Get alarms with filters
- `GET /api/alarms/active` - Get active alarms
- `POST /api/alarms/{id}/acknowledge` - Acknowledge alarm
- `POST /api/alarms/{id}/resolve` - Resolve alarm
- `GET /api/kpis/network-health` - Get network health KPI
- `GET /api/kpis/history` - Get KPI history

### WebSocket

Connect to: `ws://localhost:8080/ws`

Topics:
- `/topic/alarms` - Real-time alarm updates
- `/topic/kpis` - Real-time KPI updates

## Development

```bash
# Run tests
mvn test

# Run with auto-reload
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=true"
```

## Architecture

```
├── model/          # MongoDB entities
├── repository/     # Spring Data repositories
├── service/        # Business logic
├── controller/     # REST controllers
├── config/         # Configuration classes
└── dto/            # Data Transfer Objects
```

## KPI Calculation

KPIs are calculated automatically every 5 minutes:
- Network availability
- Route health statistics
- Alarm counts by severity
- Performance metrics
- Trends and comparisons

## Health Check

`GET /actuator/health`

## Logging

Logs are output to console. Configure in `application.yml`:

```yaml
logging:
  level:
    com.telecom.nqms: DEBUG
```

## License

Proprietary - Telecom NQMS Project
