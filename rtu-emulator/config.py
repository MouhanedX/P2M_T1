from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # RTU Identity
    rtu_id: str = "RTU_01"
    rtu_name: str = "Remote Test Unit 01"
    rtu_location: str = "Tunis Central Exchange"
    
    # EMS Connection
    ems_url: str = "http://localhost:8080"
    ems_connection_timeout: int = 10
    
    # Monitoring Configuration
    monitoring_interval: int = 300  # seconds
    auto_start: bool = False
    
    # Routes
    routes: str = "OR_1,OR_2,OR_3,OR_4,OR_5"
    
    # Alarm Thresholds (in dB)
    alarm_threshold_degradation: float = 3.0
    alarm_threshold_break: float = 10.0
    event_loss_threshold: float = 1.0
    
    # OTDR Simulation Parameters
    fiber_attenuation: float = 0.2  # dB/km
    min_fiber_length: int = 10  # km
    max_fiber_length: int = 50  # km
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def get_routes_list(self) -> List[str]:
        """Parse routes string into list."""
        return [r.strip() for r in self.routes.split(",") if r.strip()]


# Global settings instance
settings = Settings()
