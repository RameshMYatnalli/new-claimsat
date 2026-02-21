"""
Claims API Routes
Handles all ClaimSat endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
import uuid
from datetime import datetime
import json
from core.database import db
from models.claim import Claim, ClaimCreate, ClaimEvent, Evidence, EvidenceType, ClaimResponse
from services.claim_scoring import calculate_claim_score
from services.evidence_analysis import analyze_evidence
router = APIRouter()
@router.post("/", response_model=ClaimResponse)
async def create_claim(claim_data: ClaimCreate):
    """Create a new claim"""
    try:
        claim_id = f"CLM{uuid.uuid4().hex[:8].upper()}"
        
        claim = Claim(
            claim_id=claim_id,
            **claim_data.dict()
        )
        
        # Insert into database
        await db.claims.insert_one(claim.dict())
        
        # Create event
        event = ClaimEvent(
            event_id=str(uuid.uuid4()),
            claim_id=claim_id,
            event_type="created",
            event_data=claim_data.dict()
        )
        await db.claim_events.insert_one(event.dict())
        
        return ClaimResponse(
            success=True,
            claim=claim,
            message=f"Claim {claim_id} created successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/{claim_id}/evidence")
async def upload_evidence(
    claim_id: str,
    file: UploadFile = File(...),
    capture_time: Optional[str] = Form(None),
    location: Optional[str] = Form(None)
):
    """Upload evidence for a claim"""
    try:
        # Check if claim exists
        claim = await db.claims.find_one({"claim_id": claim_id})
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        # Read file
        file_bytes = await file.read()
        file_extension = f".{file.filename.split('.')[-1]}"
        
        # Analyze evidence
        visual_score, visual_explanation, file_hash = analyze_evidence(
            file_bytes,
            file_extension
        )
        
        # Determine evidence type
        if file_extension in ['.mp4', '.mov', '.avi']:
            evidence_type = EvidenceType.VIDEO
        elif file_extension in ['.jpg', '.jpeg', '.png']:
            evidence_type = EvidenceType.IMAGE
        else:
            evidence_type = EvidenceType.DOCUMENT
        
        # Parse location if provided
        location_dict = None
        if location:
            location_dict = json.loads(location)
        
        # Create evidence record
        evidence = Evidence(
            evidence_id=str(uuid.uuid4()),
            type=evidence_type,
            file_hash=file_hash,
            file_size=len(file_bytes),
            capture_time=capture_time,
            location=location_dict,
            metadata={
                "filename": file.filename,
                "visual_score": visual_score,
                "visual_explanation": visual_explanation
            }
        )
        
        # Update claim with evidence
        await db.claims.update_one(
            {"claim_id": claim_id},
            {
                "$push": {"evidence": evidence.dict()},
                "$set": {"updated_at": datetime.utcnow().isoformat()}
            }
        )
        
        # Create event
        event = ClaimEvent(
            event_id=str(uuid.uuid4()),
            claim_id=claim_id,
            event_type="evidence_added",
            event_data=evidence.dict()
        )
        await db.claim_events.insert_one(event.dict())
        
        return {
            "success": True,
            "evidence": evidence.dict(),
            "message": "Evidence uploaded successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/{claim_id}/score")
async def score_claim(claim_id: str):
    """Calculate score for a claim"""
    try:
        # Get claim
        claim = await db.claims.find_one({"claim_id": claim_id})
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        # Prepare visual analyses from evidence
        visual_analyses = {}
        for evidence in claim.get("evidence", []):
            evidence_id = evidence["evidence_id"]
            visual_score = evidence.get("metadata", {}).get("visual_score", 0.5)
            visual_explanation = evidence.get("metadata", {}).get("visual_explanation", "")
            visual_analyses[evidence_id] = (visual_score, visual_explanation)
        
        # Calculate score
        score = await calculate_claim_score(
            claim_location=claim["location"],
            incident_time=claim["incident_date"],
            disaster_id=claim.get("disaster_id"),
            evidence_list=claim.get("evidence", []),
            visual_analyses=visual_analyses
        )
        
        # Update claim with score
        await db.claims.update_one(
            {"claim_id": claim_id},
            {
                "$set": {
                    "score": score.dict(),
                    "status": score.status,
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        # Create event
        event = ClaimEvent(
            event_id=str(uuid.uuid4()),
            claim_id=claim_id,
            event_type="scored",
            event_data=score.dict()
        )
        await db.claim_events.insert_one(event.dict())
        
        return {
            "success": True,
            "score": score.dict(),
            "message": "Claim scored successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/{claim_id}")
async def get_claim(claim_id: str):
    """Get claim by ID"""
    try:
        claim = await db.claims.find_one({"claim_id": claim_id})
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        # Remove MongoDB _id
        claim.pop("_id", None)
        
        return ClaimResponse(
            success=True,
            claim=claim
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/")
async def list_claims(
    status: Optional[str] = None,
    disaster_id: Optional[str] = None,
    limit: int = 50
):
    """List claims with optional filters"""
    try:
        query = {}
        if status:
            query["status"] = status
        if disaster_id:
            query["disaster_id"] = disaster_id
        
        claims = await db.claims.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        # Remove MongoDB _id
        for claim in claims:
            claim.pop("_id", None)
        
        return {
            "success": True,
            "claims": claims,
            "count": len(claims)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))