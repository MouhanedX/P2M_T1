# RTU Emulator

Python FastAPI-based emulator for Remote Test Unit (RTU) simulating OTDR measurements in fiber optic networks.

## Features

- **OTDR Simulation**: Realistic fiber trace generation with attenuation, splices, connectors
- **Fault Detection**: Automatic detection of breaks, degradation, and high-loss events
- **Alarm Generation**: Creates telecom-standard alarms with severity levels
- **EMS Integration**: Sends alarms to central management system via REST API
- **Periodic Monitoring**: Configurable interval testing of multiple fiber routes
- **On-Demand Testing**: Trigger immediate tests for specific routes
- **REST API**: Full API with Swagger documentation

## Architecture

```
┌─────────────────────────┐
│   OTDR Simulator        │  Generates realistic fiber traces
│   - Signal attenuation  │
│   - Event generation    │
│   - Loss calculation    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Alarm Service         │  Analyzes traces & creates alarms
│   - Threshold checking  │
│   - Severity assignment │
│   - Deduplication       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   EMS Client            │  Sends alarms to EMS
│   - REST API calls      │
│   - Retry logic         │
│   - Connection checking │
└─────────────────────────┘
```

## Quick Start

### Using Docker

```bash
# From project root
docker-compose up rtu-emulator

# Access API documentation
http://localhost:8001/docs
```

### Local Development

```bash
cd rtu-emulator

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the application
uvicorn main:app --reload --port 8001
```

## Configuration

Edit `.env` file or set environment variables:

```env
# RTU Identity
RTU_ID=RTU_01
RTU_NAME=Remote Test Unit 01
RTU_LOCATION=Tunis Central Exchange

# EMS Connection
EMS_URL=http://localhost:8080

# Monitoring
MONITORING_INTERVAL=300  # seconds
AUTO_START=false

# Routes (comma-separated)
ROUTES=OR_1,OR_2,OR_3,OR_4,OR_5

# Thresholds (dB)
ALARM_THRESHOLD_DEGRADATION=3.0
ALARM_THRESHOLD_BREAK=10.0
```

## API Endpoints

### Status & Control

- `GET /api/rtu/status` - Get RTU and route status
- `POST /api/rtu/start` - Start periodic monitoring
- `POST /api/rtu/stop` - Stop monitoring
- `GET /api/rtu/config` - Get configuration

### Testing

- `POST /api/rtu/test/{route_id}` - Run test on specific route
- `GET /api/rtu/routes` - List all routes
- `GET /api/rtu/routes/{route_id}` - Get route details

### Examples

```bash
# Check RTU status
curl http://localhost:8001/api/rtu/status

# Start monitoring
curl -X POST http://localhost:8001/api/rtu/start

# Test specific route
curl -X POST http://localhost:8001/api/rtu/test/OR_1

# View routes
curl http://localhost:8001/api/rtu/routes
```

## OTDR Simulation Details

### Fiber Events Generated

| Event Type | Loss Range | Description |
|------------|------------|-------------|
| Splice     | 0.05-0.15 dB | Fiber splices along cable |
| Connector  | 0.2-0.5 dB | Connection points |
| Break      | 15-25 dB | Complete fiber break |
| Bend       | 1-3 dB | Fiber bend/degradation |

### Loss Calculation

```
Total Loss = (Fiber Length × Attenuation) + Σ(Event Losses) + Noise
```

- Standard attenuation: 0.2 dB/km (single-mode fiber)
- Measurement noise: ±0.1 dB

### Fault Scenarios (Probabilistic)

- **90%** - Normal operation (no faults)
- **6%** - Degradation (moderate additional loss)
- **2%** - Fiber break (critical loss)
- **2%** - High-loss splice (bad connection)

## Alarm Types

### Fiber Break (CRITICAL)
- Triggered when total loss > 10 dB or break event detected
- Immediate attention required
- Service affecting

### Degradation (MEDIUM)
- Triggered when loss 3-10 dB
- Indicates developing problem
- Preventive maintenance needed

### High Event Loss (HIGH)
- Individual event loss > 1 dB
- Bad splice or connector
- Repair recommended

### RTU Availability (HIGH)
- RTU communication issues
- System health problem

## Project Structure

```
rtu-emulator/
├── main.py                 # FastAPI application
├── config.py               # Configuration management
├── models.py               # Pydantic data models
├── otdr_simulator.py       # OTDR trace generation
├── alarm_service.py        # Alarm analysis and creation
├── ems_client.py           # EMS communication
├── monitor_service.py      # Periodic monitoring orchestration
├── requirements.txt        # Python dependencies
├── Dockerfile              # Container image definition
└── .env.example            # Configuration template
```

## Development

### Running Tests

```bash
# (Tests to be implemented)
pytest
```

### Code Style

```bash
# Format code
black .

# Lint
flake8 .
```

## Troubleshooting

**RTU won't start:**
- Check Python version (3.11+ required)
- Verify all dependencies installed: `pip install -r requirements.txt`
- Check port 8001 is available

**No alarms generated:**
- Monitoring must be started: `POST /api/rtu/start`
- Faults are random (90% normal operation)
- Force test: `POST /api/rtu/test/{route_id}`

**EMS connection failed:**
- Check EMS URL in configuration
- Verify EMS service is running
- Check network connectivity
- Review logs for detailed errors

## Logs

Application logs include:
- Route test results
- Alarm generation events
- EMS communication status
- Errors and warnings

View logs:
```bash
# Docker
docker-compose logs -f rtu-emulator

# Local
# Logs output to console
```

## Future Enhancements

- [ ] SNMP trap support
- [ ] MQTT protocol option
- [ ] Reference trace storage and comparison
- [ ] Multiple wavelength simulation
- [ ] Bidirectional testing
- [ ] Event reflectance simulation
- [ ] Historical trace storage

## Technical Details

**Dependencies:**
- FastAPI - Modern web framework
- Pydantic - Data validation
- NumPy - Numerical simulations
- httpx - Async HTTP client

**Standards:**
- Telecom alarm severity levels
- OTDR measurement principles
- Fiber optic loss budgets

---

**Status**: ✅ Fully Implemented and Tested
