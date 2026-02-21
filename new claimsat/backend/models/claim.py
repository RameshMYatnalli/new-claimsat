"""
Claim Data Models
Defines claim structure, evidence, and scoring
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
class ClaimStatus(str, Enum):
    """Claim status based on confidence score"""
    PENDING = "pending"
    APPROVED = "approved"
    REVIEW_REQUIRED = "review_required"
    REJECTED = "rejected"
class EvidenceType(str, Enum):
    """Types of evidence"""
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
class Evidence(BaseModel):
    """Evidence model"""
    evidence_id: str
    type: EvidenceType
    file_hash: str
    file_size: int
    capture_time: Optional[str] = None
    location: Optional[Dict[str, float]] = None  # {lat, lng}
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    uploaded_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
class ScoringFactors(BaseModel):
    """Individual scoring factors with explanations"""
    location_score: float = Field(..., ge=0, le=100)
    location_explanation: str
    
    time_score: float = Field(..., ge=0, le=100)
    time_explanation: str
    
    evidence_type_score: float = Field(..., ge=0, le=100)
    evidence_type_explanation: str
    
    visual_relevance_score: float = Field(..., ge=0, le=100)
    visual_relevance_explanation: str
    
    metadata_integrity_score: float = Field(..., ge=0, le=100)
    metadata_integrity_explanation: str
class ClaimScore(BaseModel):
    """Claim scoring result"""
    confidence_score: float = Field(..., ge=0, le=100)
    status: ClaimStatus
    factors: ScoringFactors
    final_explanation: str
    scored_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
class Claim(BaseModel):
    """Claim model"""
    claim_id: str = Field(..., description="Unique claim identifier")
    claimant_name: str
    claimant_contact: str
    property_address: str
    location: Dict[str, float] = Field(..., description="Claim location {lat, lng}")
    disaster_id: Optional[str] = None
    incident_date: str = Field(..., description="When damage occurred (ISO format)")
    damage_description: str
    estimated_loss: Optional[float] = Field(None, ge=0)
    evidence: List[Evidence] = Field(default_factory=list)
    score: Optional[ClaimScore] = None
    status: ClaimStatus = Field(default=ClaimStatus.PENDING)
    
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
class ClaimCreate(BaseModel):
    """Claim creation request"""
    claimant_name: str
    claimant_contact: str
    property_address: str
    location: Dict[str, float]
    disaster_id: Optional[str] = None
    incident_date: str
    damage_description: str
    estimated_loss: Optional[float] = None
class ClaimEvent(BaseModel):
    """Claim event for audit trail"""
    event_id: str
    claim_id: str
    event_type: str  # created, updated, scored, evidence_added, status_changed
    event_data: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    performed_by: Optional[str] = None
class ClaimResponse(BaseModel):
    """Claim API response"""
    success: bool
    claim: Optional[Claim] = None
    message: Optional[str] = None