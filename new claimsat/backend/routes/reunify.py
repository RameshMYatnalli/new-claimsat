"""
Reunify API Routes
Handles all Reunify endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import uuid
from datetime import datetime
from core.database import db
from models.reunify import (
    MissingPerson, MissingPersonCreate,
    Survivor, SurvivorCreate,
    ReunifyMatch, ReunifyResponse
)
from services.reunify_matching import find_matches_for_missing_person, find_matches_for_survivor
router = APIRouter()
# ==================== MISSING PERSONS ====================
@router.post("/missing-persons", response_model=ReunifyResponse)
async def create_missing_person(person_data: MissingPersonCreate):
    """Register a missing person"""
    try:
        person_id = f"MP{uuid.uuid4().hex[:8].upper()}"
        
        person = MissingPerson(
            person_id=person_id,
            **person_data.dict()
        )
        
        # Insert into database
        await db.missing_persons.insert_one(person.dict())
        
        return ReunifyResponse(
            success=True,
            data=person.dict(),
            message=f"Missing person {person_id} registered successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/missing-persons/{person_id}")
async def get_missing_person(person_id: str):
    """Get missing person by ID"""
    try:
        person = await db.missing_persons.find_one({"person_id": person_id})
        if not person:
            raise HTTPException(status_code=404, detail="Missing person not found")
        
        person.pop("_id", None)
        
        return ReunifyResponse(
            success=True,
            data=person
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/missing-persons")
async def list_missing_persons(
    disaster_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    """List missing persons with optional filters"""
    try:
        query = {}
        if disaster_id:
            query["disaster_id"] = disaster_id
        if status:
            query["status"] = status
        
        persons = await db.missing_persons.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        for person in persons:
            person.pop("_id", None)
        
        return ReunifyResponse(
            success=True,
            data=persons,
            message=f"Found {len(persons)} missing persons"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/missing-persons/{person_id}/matches")
async def get_matches_for_missing_person(person_id: str, min_confidence: float = 30.0):
    """Find potential matches for a missing person"""
    try:
        matches = await find_matches_for_missing_person(person_id, min_confidence)
        
        # Store matches in database
        for match in matches:
            # Check if match already exists
            existing = await db.reunify_matches.find_one({
                "missing_person_id": match.missing_person_id,
                "survivor_id": match.survivor_id
            })
            
            if not existing:
                await db.reunify_matches.insert_one(match.dict())
        
        matches_dict = [match.dict() for match in matches]
        
        return ReunifyResponse(
            success=True,
            data=matches_dict,
            message=f"Found {len(matches)} potential matches"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ==================== SURVIVORS ====================
@router.post("/survivors", response_model=ReunifyResponse)
async def create_survivor(survivor_data: SurvivorCreate):
    """Register a survivor"""
    try:
        survivor_id = f"SV{uuid.uuid4().hex[:8].upper()}"
        
        survivor = Survivor(
            survivor_id=survivor_id,
            **survivor_data.dict()
        )
        
        # Insert into database
        await db.survivors.insert_one(survivor.dict())
        
        return ReunifyResponse(
            success=True,
            data=survivor.dict(),
            message=f"Survivor {survivor_id} registered successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/survivors/{survivor_id}")
async def get_survivor(survivor_id: str):
    """Get survivor by ID"""
    try:
        survivor = await db.survivors.find_one({"survivor_id": survivor_id})
        if not survivor:
            raise HTTPException(status_code=404, detail="Survivor not found")
        
        survivor.pop("_id", None)
        
        return ReunifyResponse(
            success=True,
            data=survivor
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/survivors")
async def list_survivors(
    disaster_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100
):
    """List survivors with optional filters"""
    try:
        query = {}
        if disaster_id:
            query["disaster_id"] = disaster_id
        if status:
            query["status"] = status
        
        survivors = await db.survivors.find(query).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        for survivor in survivors:
            survivor.pop("_id", None)
        
        return ReunifyResponse(
            success=True,
            data=survivors,
            message=f"Found {len(survivors)} survivors"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/survivors/{survivor_id}/matches")
async def get_matches_for_survivor(survivor_id: str, min_confidence: float = 30.0):
    """Find potential matches for a survivor"""
    try:
        matches = await find_matches_for_survivor(survivor_id, min_confidence)
        
        # Store matches in database
        for match in matches:
            # Check if match already exists
            existing = await db.reunify_matches.find_one({
                "missing_person_id": match.missing_person_id,
                "survivor_id": match.survivor_id
            })
            
            if not existing:
                await db.reunify_matches.insert_one(match.dict())
        
        matches_dict = [match.dict() for match in matches]
        
        return ReunifyResponse(
            success=True,
            data=matches_dict,
            message=f"Found {len(matches)} potential matches"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ==================== MATCHES ====================
@router.get("/matches")
async def list_matches(
    disaster_id: Optional[str] = None,
    min_confidence: Optional[float] = None,
    verified: Optional[bool] = None,
    limit: int = 100
):
    """List all matches with optional filters"""
    try:
        query = {}
        if min_confidence is not None:
            query["confidence_score"] = {"$gte": min_confidence}
        if verified is not None:
            query["verified"] = verified
        
        matches = await db.reunify_matches.find(query).sort("confidence_score", -1).limit(limit).to_list(length=limit)
        
        for match in matches:
            match.pop("_id", None)
        
        return ReunifyResponse(
            success=True,
            data=matches,
            message=f"Found {len(matches)} matches"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/matches/{match_id}/verify")
async def verify_match(
    match_id: str,
    verified: bool,
    verified_by: str,
    verification_notes: Optional[str] = None
):
    """Verify or reject a match (authority only)"""
    try:
        match = await db.reunify_matches.find_one({"match_id": match_id})
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Update match
        update_data = {
            "verified": verified,
            "verified_by": verified_by,
            "verified_at": datetime.utcnow().isoformat(),
            "verification_notes": verification_notes,
            "status": "confirmed" if verified else "rejected"
        }
        
        await db.reunify_matches.update_one(
            {"match_id": match_id},
            {"$set": update_data}
        )
        
        # If verified, update missing person and survivor status
        if verified:
            await db.missing_persons.update_one(
                {"person_id": match["missing_person_id"]},
                {"$set": {"status": "reunited", "updated_at": datetime.utcnow().isoformat()}}
            )
            
            await db.survivors.update_one(
                {"survivor_id": match["survivor_id"]},
                {"$set": {"status": "reunited", "updated_at": datetime.utcnow().isoformat()}}
            )
        
        return ReunifyResponse(
            success=True,
            message=f"Match {'verified' if verified else 'rejected'} successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ==================== DISASTERS ====================
@router.post("/disasters")
async def create_disaster(disaster_data: dict):
    """Create a disaster zone (admin only)"""
    try:
        from models.disaster import Disaster, DisasterCreate
        
        disaster = Disaster(**disaster_data)
        
        # Insert into database
        await db.disasters.insert_one(disaster.dict())
        
        return ReunifyResponse(
            success=True,
            data=disaster.dict(),
            message=f"Disaster {disaster.disaster_id} created successfully"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/disasters")
async def list_disasters(status: Optional[str] = None):
    """List all disasters"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        disasters = await db.disasters.find(query).sort("created_at", -1).to_list(length=100)
        
        for disaster in disasters:
            disaster.pop("_id", None)
        
        return ReunifyResponse(
            success=True,
            data=disasters
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/disasters/{disaster_id}")
async def get_disaster(disaster_id: str):
    """Get disaster by ID"""
    try:
        disaster = await db.disasters.find_one({"disaster_id": disaster_id})
        if not disaster:
            raise HTTPException(status_code=404, detail="Disaster not found")
        
        disaster.pop("_id", None)
        
        return ReunifyResponse(
            success=True,
            data=disaster
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))