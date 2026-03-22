from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import logging
from typing import List

from models import RTUStatus, RouteInfo, OTDRTrace, Alarm
from monitor_service import MonitorService
from otdr_simulator import OTDRSimulator
from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global monitor service instance
monitor_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    global monitor_service
    
    # Startup
    logger.info(f"Starting RTU Emulator: {settings.rtu_id}")
    monitor_service = MonitorService(settings.rtu_id)
    
    # Auto-start monitoring if configured
    if settings.auto_start:
        logger.info("Auto-starting monitoring")
        await monitor_service.start_monitoring()
    
    yield
    
    # Shutdown
    logger.info("Shutting down RTU Emulator")
    if monitor_service and monitor_service.is_running:
        await monitor_service.stop_monitoring()


# Create FastAPI application
app = FastAPI(
    title="NQMS Fiber RTU Emulator",
    description="Remote Test Unit emulator for fiber optic network monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "NQMS Fiber RTU Emulator",
        "version": "1.0.0",
        "rtu_id": settings.rtu_id,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "rtu_id": settings.rtu_id
    }


@app.get("/api/rtu/status", response_model=RTUStatus)
async def get_rtu_status():
    """Get current RTU status including all monitored routes."""
    if not monitor_service:
        raise HTTPException(status_code=503, detail="Monitor service not initialized")
    
    status_data = monitor_service.get_status()
    
    # Check EMS connection
    ems_connected = await monitor_service.ems_client.check_connection()
    
    return RTUStatus(
        rtu_id=settings.rtu_id,
        rtu_name=settings.rtu_name,
        location=settings.rtu_location,
        is_monitoring=status_data["is_monitoring"],
        routes=status_data["routes"],
        alarms_sent_today=status_data["alarms_sent_today"],
        ems_connected=ems_connected,
        power_supply=status_data.get("power_supply", "Normal"),
        temperature_c=status_data.get("temperature_c", 35.0),
        temperature_state=status_data.get("temperature_state", "OK"),
        communication="Connected" if ems_connected else "Disconnected",
        otdr_availability=status_data.get("otdr_availability", "Ready")
    )


@app.post("/api/rtu/start")
async def start_monitoring():
    """Start periodic monitoring of all routes."""
    if not monitor_service:
        raise HTTPException(status_code=503, detail="Monitor service not initialized")
    
    if monitor_service.is_running:
        raise HTTPException(status_code=400, detail="Monitoring already running")
    
    await monitor_service.start_monitoring()
    
    return {
        "message": "Monitoring started",
        "interval_seconds": settings.monitoring_interval,
        "routes": list(monitor_service.routes.keys())
    }


@app.post("/api/rtu/stop")
async def stop_monitoring():
    """Stop periodic monitoring."""
    if not monitor_service:
        raise HTTPException(status_code=503, detail="Monitor service not initialized")
    
    if not monitor_service.is_running:
        raise HTTPException(status_code=400, detail="Monitoring not running")
    
    await monitor_service.stop_monitoring()
    
    return {"message": "Monitoring stopped"}


@app.post("/api/rtu/test/{route_id}")
async def test_route(route_id: str, background_tasks: BackgroundTasks):
    """
    Trigger on-demand test for a specific route.
    
    Args:
        route_id: ID of the route to test (e.g., OR_1)
    """
    if not monitor_service:
        raise HTTPException(status_code=503, detail="Monitor service not initialized")
    
    if route_id not in monitor_service.routes:
        raise HTTPException(
            status_code=404,
            detail=f"Route {route_id} not found. Available routes: {list(monitor_service.routes.keys())}"
        )
    
    logger.info(f"On-demand test requested for route {route_id}")
    
    # Run test in background
    background_tasks.add_task(monitor_service.test_route, route_id, "Manual")
    
    return {
        "message": f"Test initiated for route {route_id}",
        "route_id": route_id,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/rtu/routes", response_model=List[RouteInfo])
async def get_routes():
    """Get information about all monitored routes."""
    if not monitor_service:
        raise HTTPException(status_code=503, detail="Monitor service not initialized")
    
    return list(monitor_service.routes.values())


@app.get("/api/rtu/routes/{route_id}", response_model=RouteInfo)
async def get_route(route_id: str):
    """Get information about a specific route."""
    if not monitor_service:
        raise HTTPException(status_code=503, detail="Monitor service not initialized")
    
    try:
        return monitor_service.get_route_info(route_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/rtu/config")
async def get_config():
    """Get RTU configuration."""
    return {
        "rtu_id": settings.rtu_id,
        "rtu_name": settings.rtu_name,
        "location": settings.rtu_location,
        "ems_url": settings.ems_url,
        "monitoring_interval": settings.monitoring_interval,
        "routes": settings.get_routes_list(),
        "thresholds": {
            "degradation_db": settings.alarm_threshold_degradation,
            "break_db": settings.alarm_threshold_break,
            "event_loss_db": settings.event_loss_threshold
        },
        "otdr_parameters": {
            "fiber_attenuation_db_per_km": settings.fiber_attenuation,
            "min_fiber_length_km": settings.min_fiber_length,
            "max_fiber_length_km": settings.max_fiber_length
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
