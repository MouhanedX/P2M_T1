# NQMS Fiber Emulator - Multi-RTU Migration Guide

## Overview
The NQMS project has been successfully adapted to support **multiple RTUs and Routes from MongoDB Atlas** instead of hardcoded/environment-based configuration.

## Key Changes

### 1. RTU Emulator (Python FastAPI)

#### New Files Created:
- **`mongodb_service.py`**: Service to fetch RTUs and Routes from MongoDB
  - `fetch_all_rtus()`: Get all active RTUs
  - `fetch_rtu_by_id(rtu_id)`: Get specific RTU
  - `fetch_routes_for_rtu(rtu_id)`: Get routes for a specific RTU
  - `fetch_all_routes()`: Get all active routes

#### Updated Files:

**`config.py`**:
- Added `MONGODB_URI` setting
- Added `USE_DATABASE_RTU` flag (default: true)
- Added `AUTO_START` flag (default: true)
- Maintains backward compatibility with legacy route configuration

**`monitor_service.py`**:
- Now fetches routes from MongoDB for each RTU instead of hardcoded config
- `_initialize_routes()` now checks `USE_DATABASE_RTU` flag
- If `USE_DATABASE_RTU=true`: fetches routes from database
- If `USE_DATABASE_RTU=false`: uses legacy configuration

**`main.py`**:
- Changed from single RTU instance to multiple RTU services
- New global `monitor_services: Dict[str, MonitorService]` to manage multiple RTUs
- New function `initialize_rtu_monitors()`: fetches all RTUs from database and creates monitor service for each
- New function `start_all_monitoring()`: starts monitoring for all RTUs
- Updated all endpoints to support multiple RTUs with `/{rtu_id}/` path prefix

#### New API Endpoints:
```
GET  /api/rtus                          # List all active RTU statuses
GET  /api/rtu/{rtu_id}/status           # Get specific RTU status
POST /api/rtu/{rtu_id}/start            # Start monitoring
POST /api/rtu/{rtu_id}/stop             # Stop monitoring
POST /api/rtu/{rtu_id}/test/{route_id}  # Manual test
GET  /api/rtu/{rtu_id}/routes           # Get all routes for RTU
GET  /api/rtu/{rtu_id}/routes/{route_id}# Get specific route
GET  /api/config                         # Get emulator config
```

**`requirements.txt`**:
- Added `pymongo==4.6.1` for MongoDB connectivity

### 2. Docker Compose Configuration

**Updated `docker-compose.yml`**:
- RTU Emulator now receives `MONGODB_URI` from `.env`
- New environment variable: `USE_DATABASE_RTU=true`
- Removed hardcoded `ROUTES` variable
- Depends on both MongoDB and EMS Backend services
- Auto-starts monitoring for all database RTUs

### 3. Database Seed Script (One-time Setup)

**`seed_rtus_routes.py`**:
- Extracted RTUs and Routes from `standalone-rtu-map/app.js`
- **5 RTUs**: RTU_TN_01, RTU_TN_02, RTU_TN_03, RTU_TN_04, RTU_TN_05
- **15 Routes**: 3 routes per RTU with geographic coordinates and waypoints
- Used for initial population of MongoDB Atlas
- **Can be deleted after setup** (one-time use script)

### 4. Data in MongoDB Atlas

#### RTUs Collection (`rtus`):
```javascript
{
  "rtuId": "RTU_TN_01",
  "name": "Tunis RTU",
  "city": "Tunis",
  "location": { "type": "Point", "coordinates": [lng, lat] },
  "lat": 36.892388340093454,
  "lng": 10.208442785262585,
  "color": "#00d4aa",
  "status": "ACTIVE",
  "createdAt": ISODate(...)
}
```

#### Routes Collection (`routes`):
```javascript
{
  "routeId": "RTU_TN_02_R1",
  "rtuId": "RTU_TN_02",
  "name": "Route to Route_1774203193124",
  "status": "ACTIVE",
  "distanceKm": 15,
  "lat": 36.163644910757554,
  "lng": 8.715141950986906,
  "via": [[lat, lng], ...],  // waypoints
  "createdAt": ISODate(...)
}
```

## How It Works Now

### Startup Flow:
1. RTU Emulator container starts
2. Reads `MONGODB_URI` from environment
3. Fetches all active RTUs from `rtus` collection
4. For each RTU:
   - Creates a `MonitorService` instance
   - Fetches associated routes from `routes` collection (where `rtuId` matches)
   - Initializes OTDR simulator and alarm service
5. Auto-starts monitoring for all RTUs
6. Generates OTDR traces and alarms for all routes

### Monitoring Loop:
1. For each configured RTU and its routes:
   - Generate OTDR trace with fiber events
   - Detect faults (simulated)
   - Create alarms based on thresholds
   - Send results to EMS Backend
   - Calculate KPIs

### KPI Calculation:
- Aggregates data from **all RTUs and all routes**
- Calculates network-wide health metrics:
  - Network Availability (% of normal routes)
  - Route Status Counts (Normal/Degraded/Broken)
  - Alarm Statistics (by severity)
  - Fiber Loss (avg/max across all routes)
  - Event Counts
  - RTU Uptime
  - MTTF/MTBF metrics

## Environment Variables

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nqms

# RTU Emulator Configuration
USE_DATABASE_RTU=true              # Fetch RTUs from database
MONGODB_URI=<connection_string>    # MongoDB connection
EMS_URL=http://ems-backend:8080    # EMS Backend URL
MONITORING_INTERVAL=60             # Seconds between tests
AUTO_START=true                    # Auto-start monitoring

# Alarm Thresholds
ALARM_THRESHOLD_DEGRADATION=3.0    # dB
ALARM_THRESHOLD_BREAK=10.0         # dB
EVENT_LOSS_THRESHOLD=1.0           # dB

# OTDR Simulation
FIBER_ATTENUATION=0.2              # dB/km
MIN_FIBER_LENGTH=10                # km
MAX_FIBER_LENGTH=50                # km
```

## Backward Compatibility

The system maintains backward compatibility with the old single-RTU model:
- Set `USE_DATABASE_RTU=false` to use legacy configuration
- Define routes using `ROUTES` environment variable
- System will create single RTU from config variables

## Testing the Multi-RTU Setup

### 1. Check Active RTUs:
```bash
curl http://localhost:8001/api/rtus
```

### 2. Get Status of Specific RTU:
```bash
curl http://localhost:8001/api/rtu/RTU_TN_01/status
```

### 3. List Routes for an RTU:
```bash
curl http://localhost:8001/api/rtu/RTU_TN_02/routes
```

### 4. Trigger Manual Test:
```bash
curl -X POST http://localhost:8001/api/rtu/RTU_TN_01/test/RTU_TN_01_R1
```

## Dashboard Integration

The React Dashboard will:
- Fetch alarms and KPIs for all RTUs
- Display network topology with all 5 RTUs from MongoDB
- Show real-time metrics aggregated from all monitoring services
- Support filtering by RTU and route
- Display geographic map with all RTU locations

## Performance Considerations

- Multiple RTU monitoring runs in parallel
- Each RTU has its own OTDR simulator and alarm service
- Routes are fetched once at startup, cached in memory
- KPI calculation aggregates across all RTUs (5-minute interval)
- Database queries are minimal (one-time at startup)

## Troubleshooting

### No RTUs detected:
- Check `MONGODB_URI` is correct
- Verify RTUs collection has `"status": "ACTIVE"` documents
- Check container logs: `docker logs nqms-rtu-emulator`

### Routes not found for RTU:
- Verify routes collection has matching `"rtuId"` values
- Check `"status": "ACTIVE"` in routes collection

### Monitoring not starting:
- Check `AUTO_START=true` in environment
- Verify EMS Backend is accessible
- Check MongoDB connection is working

## Success Indicators

✓ All 5 RTUs from database are loaded  
✓ Each RTU has 3 routes loaded from database  
✓ Monitoring loops run for all RTUs simultaneously  
✓ Alarms are generated for all routes  
✓ KPIs are calculated across all data  
✓ Dashboard shows all RTUs on map  
✓ WebSocket updates show multi-RTU data  

