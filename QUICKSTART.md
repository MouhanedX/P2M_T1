# NQMS Fiber Monitoring System - Quick Start Guide

## Prerequisites Checklist

- [ ] Docker Desktop installed and running
- [ ] MongoDB Atlas account created
- [ ] MongoDB Atlas cluster created (M0 Free tier is sufficient)
- [ ] Database user created with read/write permissions
- [ ] IP whitelist configured (0.0.0.0/0 for testing, or your specific IP)

## Step-by-Step Setup

### 1. MongoDB Atlas Setup (5 minutes)

1. **Create Account**: https://www.mongodb.com/cloud/atlas/register
2. **Create Cluster**:
   - Choose "Shared" (Free tier)
   - Provider: AWS, Google Cloud, or Azure
   - Region: Choose closest to your location
   - Cluster Name: `nqms-cluster`

3. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `nqms_admin`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"

4. **Configure Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - For testing: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP address

5. **Get Connection String**:
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js / Version: 4.1 or later
   - Copy the connection string (looks like):
     ```
     mongodb+srv://nqms_admin:<password>@nqms-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Add database name: `.../nqms?retryWrites=true&w=majority`

### 2. Project Configuration (2 minutes)

```powershell
# Navigate to project directory
cd C:\Users\GIGABYTE\Desktop\nqms-fiber-emulator

# Create .env file from template
Copy-Item .env.example .env

# Edit .env file with your MongoDB connection string
notepad .env
```

**Update the .env file:**
```env
MONGODB_URI=mongodb+srv://nqms_admin:YOUR_PASSWORD@nqms-cluster.xxxxx.mongodb.net/nqms?retryWrites=true&w=majority
```

### 3. Build and Start Services (5-10 minutes first time)

```powershell
# Build all Docker images (first time takes 5-10 minutes)
docker-compose build

# Start all services
docker-compose up

# OR start in detached mode (background)
docker-compose up -d
```

**Expected output:**
```
[+] Running 3/3
 ✔ Container nqms-ems-backend    Started
 ✔ Container nqms-rtu-emulator   Started
 ✔ Container nqms-dashboard      Started
```

### 4. Verify Services (1 minute)

Open your browser and check:

1. **Dashboard**: http://localhost:3000
   - Should see "Network Quality Monitoring System" header
   - KPI cards should load (may be empty initially)

2. **EMS API Documentation**: http://localhost:8080/swagger-ui.html
   - Should see Swagger UI with API endpoints

3. **EMS Health Check**: http://localhost:8080/actuator/health
   - Should return: `{"status":"UP"}`

4. **RTU Emulator API**: http://localhost:8001/docs
   - Should see FastAPI documentation

### 5. Initialize Data (2 minutes)

**Start RTU monitoring** to generate initial data:

```powershell
# Start monitoring (generates OTDR measurements and alarms)
curl -X POST http://localhost:8001/start-monitoring

# Check monitoring status
curl http://localhost:8001/status
```

**Expected response:**
```json
{
  "monitoring_active": true,
  "interval_seconds": 300,
  "routes": ["OR_1", "OR_2", "OR_3", "OR_4", "OR_5"],
  "last_measurement": "2024-01-15T10:30:00Z"
}
```

**Wait 30 seconds**, then refresh the dashboard at http://localhost:3000

You should now see:
- ✅ Network Availability percentage
- ✅ Active Alarms count
- ✅ Route status distribution
- ✅ Real-time alarm list

### 6. Explore the System

#### Test Manual OTDR Measurement:
```powershell
curl -X POST http://localhost:8001/measure/OR_1
```

#### Check Active Alarms:
```powershell
curl http://localhost:8080/api/alarms/active
```

#### Get Network Health KPIs:
```powershell
curl http://localhost:8080/api/kpis/network-health
```

#### Acknowledge an Alarm (replace {id} with actual alarm ID):
```powershell
curl -X POST http://localhost:8080/api/alarms/{id}/acknowledge -H "Content-Type: application/json" -d "{\"acknowledgedBy\":\"operator\",\"notes\":\"Investigating\"}"
```

## System Architecture

```
Port 8001: RTU Emulator
    ↓ (HTTP POST)
Port 8080: EMS Backend ← WebSocket → Port 3000: Dashboard
    ↓ (MongoDB Driver)
MongoDB Atlas (Cloud)
```

**Data Flow:**
1. RTU Emulator performs OTDR measurements every 5 minutes
2. Measurements with threshold violations create alarms → POST to EMS
3. EMS stores alarm in MongoDB Atlas
4. EMS broadcasts alarm via WebSocket to Dashboard
5. Dashboard displays real-time alarm notification
6. KPI service calculates metrics every 5 minutes
7. Dashboard shows updated KPIs

## Troubleshooting

### Issue: "Cannot connect to Docker daemon"
**Solution:**
```powershell
# Start Docker Desktop manually
# Wait 30 seconds for Docker to initialize
docker ps
```

### Issue: "MongoDBConnectionException"
**Solution:**
1. Verify MongoDB Atlas connection string in `.env`
2. Check IP whitelist in Atlas (Network Access)
3. Verify username/password are correct
4. Check container logs:
   ```powershell
   docker-compose logs ems-backend
   ```

### Issue: Dashboard shows "No data available"
**Solution:**
1. Verify EMS backend is healthy:
   ```powershell
   curl http://localhost:8080/actuator/health
   ```

2. Start RTU monitoring:
   ```powershell
   curl -X POST http://localhost:8001/start-monitoring
   ```

3. Check RTU logs:
   ```powershell
   docker-compose logs rtu-emulator
   ```

### Issue: "Port already in use"
**Solution:**
```powershell
# Find process using port 8080 (or 8001, 3000)
netstat -ano | findstr :8080

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 instead
```

### Issue: Container keeps restarting
**Solution:**
```powershell
# View container logs
docker-compose logs -f ems-backend

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart ems-backend
```

## Useful Commands

```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f ems-backend

# Rebuild single service
docker-compose up -d --build ems-backend

# Check container resource usage
docker stats

# Access container shell
docker-compose exec ems-backend sh
docker-compose exec rtu-emulator sh

# List all containers
docker ps -a

# Remove stopped containers
docker-compose rm
```

## Testing Checklist

After setup, verify these features:

- [ ] Dashboard loads at http://localhost:3000
- [ ] KPI cards display values (after starting monitoring)
- [ ] Alarm list shows active alarms
- [ ] Network status chart renders
- [ ] Click "Acknowledge" on an alarm → status changes
- [ ] Click "Resolve" on an alarm → alarm disappears
- [ ] Real-time WebSocket updates (watch for new alarms)
- [ ] API documentation at http://localhost:8080/swagger-ui.html
- [ ] RTU status endpoint returns monitoring info

## Next Steps

1. **Explore MongoDB Atlas**:
   - Go to your cluster → "Browse Collections"
   - View `nqms` database
   - Check collections: `rtus`, `routes`, `alarms`, `kpis`

2. **Customize RTU Configuration**:
   - Edit `docker-compose.yml` RTU environment variables
   - Change `MONITORING_INTERVAL`, `ALARM_THRESHOLD_DEGRADATION`, etc.
   - Restart: `docker-compose restart rtu-emulator`

3. **Add More RTUs**:
   - Duplicate `rtu-emulator` service in `docker-compose.yml`
   - Change `container_name`, `RTU_ID`, `RTU_NAME`, `ports`
   - Example:
     ```yaml
     rtu-emulator-2:
       build: ./rtu-emulator
       container_name: nqms-rtu-02
       environment:
         RTU_ID: RTU_02
         RTU_NAME: Remote Test Unit 02
       ports:
         - "8002:8001"
     ```

4. **Monitor Production**:
   - Set up MongoDB Atlas alerts
   - Enable Docker health checks
   - Configure log aggregation
   - Add Prometheus/Grafana for metrics

## Support

**Check logs if something doesn't work:**
```powershell
docker-compose logs --tail=100 -f
```

**Common log locations:**
- EMS Backend: Spring Boot logs in console
- RTU Emulator: FastAPI logs in console
- Dashboard: Nginx access logs

**Still having issues?**
1. Verify all prerequisites are met
2. Check logs with commands above
3. Ensure MongoDB Atlas is accessible
4. Verify Docker Desktop is running
5. Try `docker-compose down && docker-compose up --build`

---

**System is ready when you see:**
✅ Dashboard showing KPI cards
✅ Alarms appearing in the table
✅ Network status chart with data
✅ Real-time updates (every 5 minutes)

**Enjoy monitoring your fiber-optic network! 🎉**
