import numpy as np
import random
from typing import List
from datetime import datetime
from models import OTDRTrace, OTDREvent, EventType, TraceStatus
from config import settings


class OTDRSimulator:
    """Simulates OTDR measurements for fiber optic cables."""
    
    # Route configurations (in real system, this would be in database)
    ROUTE_CONFIG = {
        "OR_1": {"region": "Tunis", "length_km": 25.0, "splice_count": 5},
        "OR_2": {"region": "Sfax", "length_km": 35.0, "splice_count": 7},
        "OR_3": {"region": "Sousse", "length_km": 18.0, "splice_count": 4},
        "OR_4": {"region": "Tunis", "length_km": 42.0, "splice_count": 8},
        "OR_5": {"region": "Sfax", "length_km": 30.0, "splice_count": 6},
    }
    
    def __init__(self, rtu_id: str):
        self.rtu_id = rtu_id
        self.attenuation = settings.fiber_attenuation
    
    def generate_trace(self, route_id: str, inject_fault: bool = False, 
                       fault_type: str = "normal") -> OTDRTrace:
        """
        Generate a simulated OTDR trace for a route.
        
        Args:
            route_id: Identifier of the route to test
            inject_fault: Whether to inject a fault
            fault_type: Type of fault ('normal', 'degradation', 'break')
        
        Returns:
            OTDRTrace object with simulated measurements
        """
        if route_id not in self.ROUTE_CONFIG:
            raise ValueError(f"Unknown route: {route_id}")
        
        route_config = self.ROUTE_CONFIG[route_id]
        fiber_length = route_config["length_km"]
        splice_count = route_config["splice_count"]
        
        # Generate events along the fiber
        events = self._generate_events(fiber_length, splice_count, inject_fault, fault_type)
        
        # Calculate total loss
        total_loss = self._calculate_total_loss(fiber_length, events)
        
        # Determine status based on loss
        status = self._determine_status(total_loss, events)
        
        # Create trace object
        trace = OTDRTrace(
            route_id=route_id,
            rtu_id=self.rtu_id,
            timestamp=datetime.now(),
            fiber_length_km=fiber_length,
            total_loss_db=round(total_loss, 2),
            events=events,
            status=status,
            measurement_duration_ms=random.randint(800, 1200)
        )
        
        return trace
    
    def _generate_events(self, fiber_length: float, splice_count: int, 
                         inject_fault: bool, fault_type: str) -> List[OTDREvent]:
        """Generate fiber events (splices, connectors, faults)."""
        events = []
        
        # Distribute splices evenly along the cable
        splice_spacing = fiber_length / (splice_count + 1)
        
        for i in range(splice_count):
            distance = splice_spacing * (i + 1)
            # Add some random variation to splice position
            distance += random.uniform(-0.5, 0.5)
            
            # Typical splice loss: 0.05 to 0.15 dB
            loss = round(random.uniform(0.05, 0.15), 3)
            
            events.append(OTDREvent(
                type=EventType.SPLICE,
                distance_km=round(distance, 2),
                loss_db=loss
            ))
        
        # Add connectors (typically at ends and intermediate points)
        connector_count = random.randint(1, 3)
        for _ in range(connector_count):
            distance = random.uniform(1, fiber_length - 1)
            # Connector loss: 0.2 to 0.5 dB
            loss = round(random.uniform(0.2, 0.5), 3)
            
            events.append(OTDREvent(
                type=EventType.CONNECTOR,
                distance_km=round(distance, 2),
                loss_db=loss
            ))
        
        # Inject fault if requested
        if inject_fault:
            fault_distance = random.uniform(fiber_length * 0.3, fiber_length * 0.9)
            
            if fault_type == "break":
                # Fiber break: very high loss (15-25 dB)
                loss = round(random.uniform(15.0, 25.0), 2)
                events.append(OTDREvent(
                    type=EventType.BREAK,
                    distance_km=round(fault_distance, 2),
                    loss_db=loss
                ))
            
            elif fault_type == "degradation":
                # Degradation: moderate additional loss (1-3 dB)
                loss = round(random.uniform(1.0, 3.0), 3)
                events.append(OTDREvent(
                    type=EventType.BEND,
                    distance_km=round(fault_distance, 2),
                    loss_db=loss
                ))
            
            elif fault_type == "high_loss_splice":
                # Bad splice with high loss
                loss = round(random.uniform(0.5, 1.5), 3)
                events.append(OTDREvent(
                    type=EventType.SPLICE,
                    distance_km=round(fault_distance, 2),
                    loss_db=loss
                ))
        
        # Sort events by distance
        events.sort(key=lambda e: e.distance_km)
        
        return events
    
    def _calculate_total_loss(self, fiber_length: float, events: List[OTDREvent]) -> float:
        """Calculate total fiber loss."""
        # Base attenuation loss
        attenuation_loss = fiber_length * self.attenuation
        
        # Event losses
        event_loss = sum(event.loss_db for event in events)
        
        # Total loss with small random variation
        total_loss = attenuation_loss + event_loss
        total_loss += random.uniform(-0.1, 0.1)  # Measurement noise
        
        return max(0, total_loss)  # Loss can't be negative
    
    def _determine_status(self, total_loss: float, events: List[OTDREvent]) -> TraceStatus:
        """Determine trace status based on loss and events."""
        # Check for break event
        for event in events:
            if event.type == EventType.BREAK:
                return TraceStatus.BREAK
        
        # Check total loss thresholds
        if total_loss > settings.alarm_threshold_break:
            return TraceStatus.BREAK
        elif total_loss > settings.alarm_threshold_degradation:
            return TraceStatus.DEGRADATION
        else:
            return TraceStatus.NORMAL
    
    @classmethod
    def get_route_config(cls, route_id: str) -> dict:
        """Get configuration for a specific route."""
        return cls.ROUTE_CONFIG.get(route_id, {})
    
    @classmethod
    def get_all_routes(cls) -> List[str]:
        """Get list of all configured routes."""
        return list(cls.ROUTE_CONFIG.keys())
