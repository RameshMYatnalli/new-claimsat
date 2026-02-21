"""
Disaster Verification Service
Validates claims against active disasters
"""
from typing import Optional, Dict, Any, Tuple
from core.database import db
from utils.geo import calculate_location_score
from utils.time import calculate_time_score
import logging
logger = logging.getLogger(__name__)
async def get_active_disaster(disaster_id: str) -> Optional[Dict[str, Any]]:
    """Get active disaster by ID"""
    try:
        disaster = await db.disasters.find_one({"disaster_id": disaster_id})
        return disaster
    except Exception as e:
        logger.error(f"Error fetching disaster: {e}")
        return None
async def verify_claim_against_disaster(
    claim_location: Dict[str, float],
    incident_time: str,
    disaster_id: Optional[str] = None
) -> Tuple[Optional[Dict[str, Any]], float, str, float, str]:
    """
    Verify claim against disaster
    
    Returns: (disaster, location_score, location_explanation, time_score, time_explanation)
    """
    
    # If no disaster_id provided, try to find matching disaster
    if not disaster_id:
        disaster = await find_matching_disaster(claim_location, incident_time)
    else:
        disaster = await get_active_disaster(disaster_id)
    
    if not disaster:
        return None, 0.0, "No matching disaster found", 0.0, "No disaster to verify against"
    
    # Calculate location score
    location_score, location_explanation = calculate_location_score(
        claim_location,
        disaster["location"]["coordinates"]
    )
    
    # Calculate time score
    time_score, time_explanation = calculate_time_score(
        incident_time,
        disaster["start_date"],
        disaster.get("end_date")
    )
    
    return disaster, location_score, location_explanation, time_score, time_explanation
async def find_matching_disaster(
    location: Dict[str, float],
    incident_time: str
) -> Optional[Dict[str, Any]]:
    """
    Find the most relevant active disaster for given location and time
    """
    try:
        # Get all active disasters
        disasters = await db.disasters.find({"status": "active"}).to_list(length=100)
        
        best_disaster = None
        best_score = 0
        
        for disaster in disasters:
            # Calculate combined score
            loc_score, _ = calculate_location_score(
                location,
                disaster["location"]["coordinates"]
            )
            time_score, _ = calculate_time_score(
                incident_time,
                disaster["start_date"],
                disaster.get("end_date")
            )
            
            combined_score = (loc_score + time_score) / 2
            
            if combined_score > best_score:
                best_score = combined_score
                best_disaster = disaster
        
        # Only return if score is reasonable
        if best_score > 30:
            return best_disaster
        
        return None
    
    except Exception as e:
        logger.error(f"Error finding matching disaster: {e}")
        return None