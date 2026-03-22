from typing import List, Optional
from datetime import datetime
from models import OTDRTrace, Alarm, AlarmType, AlarmSeverity, EventType
from config import settings


class AlarmService:
    """Service for analyzing OTDR traces and generating alarms."""
    
    def __init__(self, rtu_id: str):
        self.rtu_id = rtu_id
        # Track last alarm per route to avoid duplicates
        self.last_alarms = {}
    
    def analyze_trace(self, trace: OTDRTrace) -> Optional[Alarm]:
        """
        Analyze OTDR trace and generate alarm if needed.
        
        Args:
            trace: OTDR trace to analyze
        
        Returns:
            Alarm object if fault detected, None otherwise
        """
        alarms = []
        
        # Check for fiber break
        if self._has_break(trace):
            alarm = self._create_break_alarm(trace)
            alarms.append(alarm)
        
        # Check for degradation
        elif self._has_degradation(trace):
            alarm = self._create_degradation_alarm(trace)
            alarms.append(alarm)
        
        # Check for high event loss
        high_loss_events = self._check_high_loss_events(trace)
        if high_loss_events:
            alarm = self._create_event_loss_alarm(trace, high_loss_events)
            alarms.append(alarm)
        
        # Return highest severity alarm
        if alarms:
            # Sort by severity (CRITICAL > HIGH > MEDIUM > LOW)
            severity_order = {
                AlarmSeverity.CRITICAL: 4,
                AlarmSeverity.HIGH: 3,
                AlarmSeverity.MEDIUM: 2,
                AlarmSeverity.LOW: 1
            }
            alarms.sort(key=lambda a: severity_order[a.severity], reverse=True)
            
            # Check if this is a duplicate of the last alarm
            last_alarm_key = f"{trace.route_id}_{alarms[0].alarm_type}"
            if last_alarm_key in self.last_alarms:
                last_alarm_time = self.last_alarms[last_alarm_key]
                # Don't send duplicate if less than 5 minutes ago
                time_diff = (datetime.now() - last_alarm_time).total_seconds()
                if time_diff < 300:
                    return None
            
            # Update last alarm timestamp
            self.last_alarms[last_alarm_key] = datetime.now()
            
            return alarms[0]
        
        # Clear alarm history if route is back to normal
        if trace.status.value == "NORMAL":
            keys_to_remove = [k for k in self.last_alarms.keys() 
                             if k.startswith(f"{trace.route_id}_")]
            for key in keys_to_remove:
                del self.last_alarms[key]
        
        return None
    
    def _has_break(self, trace: OTDRTrace) -> bool:
        """Check if trace indicates a fiber break."""
        # Check for break event
        for event in trace.events:
            if event.type == EventType.BREAK:
                return True
        
        # Check if total loss exceeds break threshold
        if trace.total_loss_db > settings.alarm_threshold_break:
            return True
        
        return False
    
    def _has_degradation(self, trace: OTDRTrace) -> bool:
        """Check if trace indicates fiber degradation."""
        if (trace.total_loss_db > settings.alarm_threshold_degradation and 
            trace.total_loss_db <= settings.alarm_threshold_break):
            return True
        return False
    
    def _check_high_loss_events(self, trace: OTDRTrace) -> List:
        """Check for individual events with high loss."""
        high_loss_events = []
        for event in trace.events:
            if event.type != EventType.BREAK and event.loss_db > settings.event_loss_threshold:
                high_loss_events.append(event)
        return high_loss_events
    
    def _create_break_alarm(self, trace: OTDRTrace) -> Alarm:
        """Create alarm for fiber break."""
        # Find break event if exists
        break_event = next((e for e in trace.events if e.type == EventType.BREAK), None)
        
        if break_event:
            description = (f"Fiber break detected at {break_event.distance_km} km "
                          f"with {break_event.loss_db} dB loss on route {trace.route_id}")
        else:
            description = (f"Excessive loss detected ({trace.total_loss_db} dB) "
                          f"indicating fiber break on route {trace.route_id}")
        
        return Alarm(
            rtu_id=self.rtu_id,
            route_id=trace.route_id,
            alarm_type=AlarmType.FIBER_BREAK,
            severity=AlarmSeverity.CRITICAL,
            description=description,
            total_loss_db=trace.total_loss_db,
            trace_data=trace
        )
    
    def _create_degradation_alarm(self, trace: OTDRTrace) -> Alarm:
        """Create alarm for fiber degradation."""
        description = (f"Fiber degradation detected on route {trace.route_id}. "
                      f"Total loss: {trace.total_loss_db} dB "
                      f"(threshold: {settings.alarm_threshold_degradation} dB)")
        
        return Alarm(
            rtu_id=self.rtu_id,
            route_id=trace.route_id,
            alarm_type=AlarmType.DEGRADATION,
            severity=AlarmSeverity.MEDIUM,
            description=description,
            total_loss_db=trace.total_loss_db,
            trace_data=trace
        )
    
    def _create_event_loss_alarm(self, trace: OTDRTrace, events: List) -> Alarm:
        """Create alarm for high loss events."""
        event_descriptions = []
        for event in events:
            event_descriptions.append(
                f"{event.type.value} at {event.distance_km} km ({event.loss_db} dB)"
            )
        
        description = (f"High loss events detected on route {trace.route_id}: "
                      f"{', '.join(event_descriptions)}")
        
        return Alarm(
            rtu_id=self.rtu_id,
            route_id=trace.route_id,
            alarm_type=AlarmType.HIGH_EVENT_LOSS,
            severity=AlarmSeverity.HIGH,
            description=description,
            total_loss_db=trace.total_loss_db,
            trace_data=trace
        )
    
    def create_rtu_availability_alarm(self, reason: str) -> Alarm:
        """Create alarm for RTU availability issues."""
        return Alarm(
            rtu_id=self.rtu_id,
            route_id="N/A",
            alarm_type=AlarmType.RTU_AVAILABILITY,
            severity=AlarmSeverity.HIGH,
            description=f"RTU {self.rtu_id} availability issue: {reason}",
            total_loss_db=0.0
        )
