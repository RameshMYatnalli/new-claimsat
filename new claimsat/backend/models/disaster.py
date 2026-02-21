"""
Disaster Data Models
Defines disaster zones and active disasters
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
class DisasterType(str, Enum):
    """Types of disasters"""
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    CYCLONE = "cyclone"
    LANDSLIDE = "landslide"
    FIRE = "fire"
    TSUNAMI = "tsunami"
    OTHER = "other"
class DisasterStatus(str, Enum):
    """Disaster status"""
    ACTIVE = "active"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
class GeoLocation(BaseModel):
    """GeoJSON location format"""
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # [[[lon, lat], ...]]
class Disaster(BaseModel):
    """Disaster model"""
    disaster_id: str = Field(..., description="Unique disaster identifier")
    name: str = Field(..., description="Disaster name")
    type: DisasterType = Field(..., description="Type of disaster")
    location: GeoLocation = Field(..., description="Affected area (GeoJSON Polygon)")
    start_date: str = Field(..., description="Disaster start datetime (ISO format)")
    end_date: Optional[str] = Field(None, description="Disaster end datetime (ISO format)")
    status: DisasterStatus = Field(default=DisasterStatus.ACTIVE)
    severity: Optional[int] = Field(None, ge=1, le=5, description="Severity (1-5)")
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
class DisasterCreate(BaseModel):
    """Disaster creation request"""
    disaster_id: str
    name: str
    type: DisasterType
    location: GeoLocation
    start_date: str
    end_date: Optional[str] = None
    severity: Optional[int] = Field(None, ge=1, le=5)
    description: Optional[str] = None
class DisasterResponse(BaseModel):
    """Disaster API response"""
    success: bool
    disaster: Optional[Disaster] = None
    message: Optional[str] = None