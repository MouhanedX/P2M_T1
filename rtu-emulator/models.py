from datetime import datetime
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field
import uuid


class EventType(str, Enum):
    """Types of fiber events."""
    SPLICE = "splice"
    CONNECTOR = "connector"
    BREAK = "break"
    REFLECTION = "reflection"
    BEND = "bend"


class TraceStatus(str, Enum):
    """Overall status of fiber trace."""
    NORMAL = "NORMAL"
    DEGRADATION = "DEGRADATION"
    BREAK = "BREAK"
    UNKNOWN = "UNKNOWN"


class OTDREvent(BaseModel):
    """Represents a single event in OTDR trace."""
    type: EventType
    distance_km: float = Field(..., description="Distance from RTU in kilometers")
    loss_db: float = Field(..., description="Loss at this event in dB")
    reflection_db: Optional[float] = Field(None, description="Reflection loss if applicable")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "splice",
                "distance_km": 5.3,
                "loss_db": 0.12,
                "reflection_db": None
            }
        }


class OTDRTrace(BaseModel):
    """Complete OTDR measurement trace."""
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    route_id: str
    rtu_id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    fiber_length_km: float
    total_loss_db: float
    events: List[OTDREvent] = []
    status: TraceStatus
    measurement_duration_ms: int = Field(default=1000)
    
    class Config:
        json_schema_extra = {
            "example": {
                "trace_id": "550e8400-e29b-41d4-a716-446655440000",
                "route_id": "OR_1",
                "rtu_id": "RTU_01",
                "timestamp": "2026-02-17T10:30:00",
                "fiber_length_km": 25.5,
                "total_loss_db": 5.8,
                "events": [
                    {"type": "splice", "distance_km": 5.3, "loss_db": 0.12},
                    {"type": "connector", "distance_km": 12.7, "loss_db": 0.35},
                    {"type": "break", "distance_km": 20.1, "loss_db": 18.5}
                ],
                "status": "BREAK",
                "measurement_duration_ms": 1000
            }
        }


class AlarmType(str, Enum):
    """Types of alarms that can be raised."""
    FIBER_FAULT = "FIBER_FAULT"
    FIBER_BREAK = "FIBER_BREAK"
    DEGRADATION = "DEGRADATION"
    RTU_AVAILABILITY = "RTU_AVAILABILITY"
    HIGH_EVENT_LOSS = "HIGH_EVENT_LOSS"


class AlarmSeverity(str, Enum):
    """Severity levels for alarms."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Alarm(BaseModel):
    """Alarm generated from OTDR analysis."""
    alarm_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rtu_id: str
    route_id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    alarm_type: AlarmType
    severity: AlarmSeverity
    description: str
    total_loss_db: float
    trace_data: Optional[OTDRTrace] = None
    acknowledged: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "alarm_id": "alarm-123",
                "rtu_id": "RTU_01",
                "route_id": "OR_1",
                "timestamp": "2026-02-17T10:30:00",
                "alarm_type": "FIBER_BREAK",
                "severity": "CRITICAL",
                "description": "Fiber break detected at 20.1 km with 18.5 dB loss",
                "total_loss_db": 18.5,
                "acknowledged": False
            }
        }


class RouteInfo(BaseModel):
    """Information about a monitored route."""
    route_id: str
    region: str
    fiber_length_km: float
    splice_count: int
    last_test_time: Optional[datetime] = None
    current_status: TraceStatus = TraceStatus.UNKNOWN
    active_alarms: int = 0


class OTDRTestReport(BaseModel):
    """Normalized OTDR test report sent to EMS for dashboard/history."""
    route_id: str
    rtu_id: str
    test_mode: str
    pulse_width_ns: int
    dynamic_range_db: float
    wavelength_nm: int
    test_result: str
    total_loss_db: float
    event_count: int
    fault_distance_km: Optional[float] = None
    status: str
    measured_at: datetime = Field(default_factory=datetime.now)


class RTUStatus(BaseModel):
    """Current status of the RTU."""
    rtu_id: str
    rtu_name: str
    location: str
    is_monitoring: bool
    routes: List[RouteInfo]
    last_heartbeat: datetime = Field(default_factory=datetime.now)
    alarms_sent_today: int = 0
    ems_connected: bool = False
    power_supply: str = "Normal"
    temperature_c: float = 35.0
    temperature_state: str = "OK"
    communication: str = "Connected"
    otdr_availability: str = "Ready"
