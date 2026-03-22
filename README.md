# NQMS Fiber-Optic Emulator - Complete System

## Overview
This project implements a **Network Quality Monitoring System (NQMS)** for fiber-optic networks with three main components:

1. **RTU Emulator** (Python/FastAPI) - Simulates Remote Test Units with OTDR monitoring
2. **EMS Backend** (Spring Boot/Java) - Element Management System with MongoDB Atlas
3. **Dashboard Frontend** (React/Vite) - Real-time monitoring dashboard

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  RTU Emulator   │────────▶│   EMS Backend    │◀────────│   Dashboard     │
│  (FastAPI)      │  HTTP   │  (Spring Boot)   │ WS/HTTP │   (React)       │
│  Port: 8001     │         │  Port: 8080      │         │   Port: 3000    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  MongoDB Atlas   │
                            │  (Cloud NoSQL)   │
                            └──────────────────┘
```

## Prerequisites

- **Docker** 20.10+ and Docker Compose 2.0+
- **MongoDB Atlas** account (free tier works)
- **Java 17** (for local development)
- **Python 3.12+** (for local development)
- **Node.js 20+** (for local development)

## Quick Start

### 1. Configure MongoDB Atlas

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster (M0 Free tier is sufficient)
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use `0.0.0.0/0` for testing)
5. Get your connection string from the "Connect" button

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/nqms?retryWrites=true&w=majority
```

### 3. Start All Services

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 4. Access Services

- **Dashboard**: http://localhost:3000
- **EMS Backend API**: http://localhost:8080/api
- **EMS API Docs**: http://localhost:8080/swagger-ui.html
- **RTU Emulator API**: http://localhost:8001/docs

## Service Details

### RTU Emulator (Port 8001)

Simulates fiber-optic test equipment with OTDR capabilities.

**Key Features:**
- OTDR trace simulation with realistic fiber events
- Automatic alarm generation based on thresholds
- Multiple route monitoring
- Scheduled measurements every 5 minutes
- RESTful API for manual control

**API Endpoints:**
- `GET /` - Service health check
- `POST /start-monitoring` - Start automatic monitoring
- `POST /stop-monitoring` - Stop monitoring
- `GET /status` - Get current monitoring status
- `POST /measure/{route_id}` - Manual OTDR measurement
- `GET /routes` - List configured routes

**Environment Variables:**
```yaml
RTU_ID: RTU_01
RTU_NAME: Remote Test Unit 01
RTU_LOCATION: Tunis Central Exchange
EMS_URL: http://ems-backend:8080
MONITORING_INTERVAL: 300  # seconds
ROUTES: OR_1,OR_2,OR_3,OR_4,OR_5
ALARM_THRESHOLD_DEGRADATION: 3.0  # dB
ALARM_THRESHOLD_BREAK: 10.0  # dB
```

### EMS Backend (Port 8080)

Element Management System for network monitoring and KPI calculation.

**Key Features:**
- MongoDB Atlas integration with 6 collections
- Real-time alarm management (create, acknowledge, resolve)
- Automated KPI calculation every 5 minutes
- WebSocket support for live dashboard updates
- RESTful API with Swagger documentation

**API Endpoints:**

*Alarms:*
- `POST /api/alarms` - Create new alarm
- `GET /api/alarms/active` - Get active alarms
- `POST /api/alarms/{id}/acknowledge` - Acknowledge alarm
- `POST /api/alarms/{id}/resolve` - Resolve alarm
- `GET /api/alarms/statistics` - Get alarm statistics

*KPIs:*
- `GET /api/kpis/network-health` - Get current network KPIs
- `GET /api/kpis/history` - Get KPI history

*WebSocket Topics:*
- `/topic/alarms` - Real-time alarm notifications
- `/topic/kpis` - Real-time KPI updates

**MongoDB Collections:**
- `rtus` - RTU device registry
- `routes` - Fiber route configurations
- `alarms` - Active and historical alarms
- `measurements` - OTDR measurement traces
- `kpis` - Calculated network KPIs
- `events` - System audit log

### Dashboard Frontend (Port 3000)

Modern React dashboard for real-time network monitoring.

**Key Features:**
- Real-time KPI visualization
- Active alarm management (acknowledge/resolve)
- Network status pie chart
- WebSocket live updates
- Responsive design with TailwindCSS
- Historical trend analysis

**Components:**
- **Dashboard** - Main overview with KPI cards
- **AlarmList** - Sortable table with actions
- **NetworkStatusChart** - Route health visualization
- **KpiCard** - Individual metric display with trends

## Development

### Local Development (Without Docker)

**EMS Backend:**
```bash
cd ems-backend
# Create .env file with MONGODB_URI
mvn spring-boot:run
```

**Dashboard Frontend:**
```bash
cd dashboard-frontend
npm install
npm run dev
# Access at http://localhost:5173
```

**RTU Emulator:**
```bash
cd rtu-emulator
pip install -r requirements.txt
python main.py
```

### Testing

**Test RTU Emulator:**
```bash
# Start monitoring
curl -X POST http://localhost:8001/start-monitoring

# Check status
curl http://localhost:8001/status

# Manual measurement
curl -X POST http://localhost:8001/measure/OR_1
```

**Test EMS Backend:**
```bash
# Get active alarms
curl http://localhost:8080/api/alarms/active

# Get network health KPIs
curl http://localhost:8080/api/kpis/network-health
```

## Database Schema

See [MONGODB_SCHEMA.md](./MONGODB_SCHEMA.md) for complete database design.

**Key Collections:**

1. **rtus** - RTU devices with location and capabilities
2. **routes** - Fiber routes with A/B endpoints and length
3. **alarms** - Incidents with severity, lifecycle, and location
4. **measurements** - OTDR traces with event detection
5. **kpis** - Aggregated metrics (availability, performance, trends)
6. **events** - System audit trail

## Monitoring & Alerts

**Alarm Severity Levels:**
- **CRITICAL** - Fiber break (>10dB loss)
- **HIGH** - Major degradation or high event loss
- **MEDIUM** - Moderate degradation (3-6dB)
- **LOW** - Minor threshold exceedances

**KPI Metrics:**
- Network availability percentage
- Active alarm count
- Route status distribution (normal/degraded/broken)
- Average fiber loss (dB)
- Mean Time To Repair (MTTR)
- Mean Time Between Failures (MTBF)

**Automated Tasks:**
- RTU measurements every 5 minutes
- KPI calculation every 5 minutes
- WebSocket notifications on alarm/KPI changes
- Automatic alarm severity classification

## Troubleshooting

**MongoDB Connection Issues:**
```bash
# Verify connection string format
# mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# Check IP whitelist in MongoDB Atlas
# Verify network connectivity
docker-compose logs ems-backend
```

**RTU Not Sending Alarms:**
```bash
# Check RTU status
curl http://localhost:8001/status

# View RTU logs
docker-compose logs rtu-emulator

# Verify EMS_URL is correct
docker-compose exec rtu-emulator env | grep EMS_URL
```

**Dashboard Not Updating:**
```bash
# Check WebSocket connection in browser console
# Verify EMS backend is running
curl http://localhost:8080/actuator/health

# Check nginx proxy configuration
docker-compose logs dashboard
```

**Container Health Checks:**
```bash
# View all service health
docker-compose ps

# Restart specific service
docker-compose restart ems-backend

# View logs
docker-compose logs -f --tail=100
```

## Production Deployment

### Security Recommendations

1. **Change default credentials** in MongoDB Atlas
2. **Enable TLS/SSL** for all services
3. **Use secrets management** (Docker Secrets, Vault)
4. **Restrict CORS origins** in EMS backend
5. **Enable authentication** on all APIs
6. **Set up monitoring & alerting** (Prometheus/Grafana)

### Performance Tuning

1. **MongoDB Indexes** - See MONGODB_SCHEMA.md for recommended indexes
2. **WebSocket Scaling** - Use Redis for multi-instance deployments
3. **Caching** - Implement Redis for KPI caching
4. **Rate Limiting** - Add API rate limits in nginx
5. **Container Resources** - Set CPU/memory limits in docker-compose

### Backup Strategy

```bash
# Backup MongoDB Atlas (automated in Atlas)
# Export measurements collection for compliance
mongodump --uri="$MONGODB_URI" --collection=measurements --out=backup/

# Backup Docker volumes
docker run --rm -v nqms_data:/data -v $(pwd):/backup alpine tar czf /backup/nqms-backup.tar.gz /data
```

## Project Structure

```
nqms-fiber-emulator/
├── docker-compose.yml          # Multi-service orchestration
├── .env.example                # Environment template
├── MONGODB_SCHEMA.md           # Database design
├── rtu-emulator/               # Python FastAPI service
│   ├── Dockerfile
│   ├── main.py
│   ├── otdr_simulator.py
│   ├── alarm_service.py
│   ├── monitor_service.py
│   ├── ems_client.py
│   ├── models.py
│   ├── config.py
│   └── requirements.txt
├── ems-backend/                # Spring Boot service
│   ├── Dockerfile
│   ├── pom.xml
│   ├── .env.example
│   └── src/main/java/com/telecom/nqms/
│       ├── model/              # Domain models
│       ├── repository/         # MongoDB repositories
│       ├── service/            # Business logic
│       ├── controller/         # REST endpoints
│       └── config/             # WebSocket config
└── dashboard-frontend/         # React application
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── components/         # React components
        ├── services/           # API & WebSocket clients
        └── App.jsx
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review logs with `docker-compose logs`
- Open an issue on GitHub

## Acknowledgments

- **MongoDB Atlas** - Cloud database platform
- **Spring Boot** - Java framework
- **FastAPI** - Python web framework
- **React & Vite** - Frontend framework
- **TailwindCSS** - UI styling
- **Recharts** - Data visualization

---

**Built with ❤️ for Telecom Network Monitoring**
