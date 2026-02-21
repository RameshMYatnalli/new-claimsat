"""
Reunify Data Models
Defines missing persons, survivors, and matching
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
class Gender(str, Enum):
    """Gender options"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"
class PersonStatus(str, Enum):
    """Person status"""
    MISSING = "missing"
    FOUND = "found"
    SEARCHING = "searching"
    REUNITED = "reunited"
class MissingPerson(BaseModel):
    """Missing person model"""
    person_id: str = Field(..., description="Unique person identifier")
    disaster_id: str = Field(..., description="Associated disaster")
    
    # Personal Information
    name: str
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[Gender] = None
    
    # Physical Description
    height: Optional[int] = Field(None, description="Height in cm")
    weight: Optional[int] = Field(None, description="Weight in kg")
    physical_description: Optional[str] = None
    
    # Last Known Information
    last_seen_location: str
    last_seen_date: str
    last_seen_coordinates: Optional[Dict[str, float]] = None  # {lat, lng}
    
    # Contact Information
    reported_by: str
    reporter_contact: str
    reporter_relation: Optional[str] = None
    
    # Status
    status: PersonStatus = Field(default=PersonStatus.MISSING)
    
    # Metadata
    photo_url: Optional[str] = None
    additional_info: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
class Survivor(BaseModel):
    """Survivor model"""
    survivor_id: str = Field(..., description="Unique survivor identifier")
    disaster_id: str = Field(..., description="Associated disaster")
    
    # Personal Information
    name: Optional[str] = None
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[Gender] = None
    
    # Physical Description
    height: Optional[int] = Field(None, description="Height in cm")
    weight: Optional[int] = Field(None, description="Weight in kg")
    physical_description: Optional[str] = None
    
    # Location Information
    current_location: str
    current_coordinates: Optional[Dict[str, float]] = None  # {lat, lng}
    shelter_name: Optional[str] = None
    
    # Registration Information
    registered_by: str  # Authority/Organization
    registered_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Status
    status: PersonStatus = Field(default=PersonStatus.SEARCHING)
    medical_condition: Optional[str] = None
    
    # Metadata
    photo_url: Optional[str] = None
    additional_info: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
class MatchFactors(BaseModel):
    """Individual matching factors with explanations"""
    name_similarity_score: float = Field(..., ge=0, le=100)
    name_explanation: str
    
    age_overlap_score: float = Field(..., ge=0, le=100)
    age_explanation: str
    
    gender_score: float = Field(..., ge=0, le=100)
    gender_explanation: str
    
    location_proximity_score: float = Field(..., ge=0, le=100)
    location_explanation: str
    
    physical_desc_score: float = Field(..., ge=0, le=100)
    physical_desc_explanation: str
class ReunifyMatch(BaseModel):
    """Reunify match model"""
    match_id: str = Field(..., description="Unique match identifier")
    missing_person_id: str
    survivor_id: str
    
    # Matching Score
    confidence_score: float = Field(..., ge=0, le=100)
    factors: MatchFactors
    
    # Verification
    verified: bool = Field(default=False)
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    verification_notes: Optional[str] = None
    
    # Status
    status: str = Field(default="pending")  # pending, confirmed, rejected
    
    # Metadata
    matched_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
class MissingPersonCreate(BaseModel):
    """Missing person creation request"""
    disaster_id: str
    name: str
    age: Optional[int] = None
    gender: Optional[Gender] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    physical_description: Optional[str] = None
    last_seen_location: str
    last_seen_date: str
    last_seen_coordinates: Optional[Dict[str, float]] = None
    reported_by: str
    reporter_contact: str
    reporter_relation: Optional[str] = None
    photo_url: Optional[str] = None
    additional_info: Optional[str] = None
class SurvivorCreate(BaseModel):
    """Survivor creation request"""
    disaster_id: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[Gender] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    physical_description: Optional[str] = None
    current_location: str
    current_coordinates: Optional[Dict[str, float]] = None
    shelter_name: Optional[str] = None
    registered_by: str
    medical_condition: Optional[str] = None
    photo_url: Optional[str] = None
    additional_info: Optional[str] = None
class ReunifyResponse(BaseModel):
    """Reunify API response"""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None