"""
Reunify Matching Service
Fuzzy matching engine for missing persons and survivors
NO exact matching - uses similarity scores
"""
from typing import List, Dict, Any, Tuple
import Levenshtein
from core.database import db
from core.config import settings
from utils.geo import calculate_location_proximity
from models.reunify import ReunifyMatch, MatchFactors
import logging
import uuid
from datetime import datetime
logger = logging.getLogger(__name__)
def calculate_name_similarity(name1: str, name2: str) -> Tuple[float, str]:
    """
    Calculate name similarity using Levenshtein distance
    Handles partial matches like "Ramesh" vs "Ramesh Kumar"
    
    Returns: (score: 0-100, explanation: str)
    """
    if not name1 or not name2:
        return 0.0, "One or both names missing"
    
    # Normalize names
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    
    # Exact match
    if n1 == n2:
        return 100.0, f"Exact name match: '{name1}'"
    
    # Check if one name is contained in the other (partial match)
    if n1 in n2 or n2 in n1:
        ratio = min(len(n1), len(n2)) / max(len(n1), len(n2))
        score = 80.0 + (ratio * 20)  # 80-100 for partial matches
        return score, f"Partial name match: '{name1}' ≈ '{name2}'"
    
    # Levenshtein similarity
    distance = Levenshtein.distance(n1, n2)
    max_len = max(len(n1), len(n2))
    
    if max_len == 0:
        return 0.0, "Empty names"
    
    similarity = (1 - distance / max_len) * 100
    
    if similarity >= 70:
        return similarity, f"High name similarity: '{name1}' ≈ '{name2}' ({similarity:.0f}%)"
    elif similarity >= 50:
        return similarity, f"Moderate name similarity: '{name1}' ≈ '{name2}' ({similarity:.0f}%)"
    else:
        return similarity, f"Low name similarity: '{name1}' vs '{name2}' ({similarity:.0f}%)"
def calculate_age_overlap(age1: int, age2: int, tolerance: int = None) -> Tuple[float, str]:
    """
    Calculate age overlap with tolerance
    Default tolerance from settings (±3 years)
    
    Returns: (score: 0-100, explanation: str)
    """
    if age1 is None or age2 is None:
        return 50.0, "Age information missing for one or both persons"
    
    if tolerance is None:
        tolerance = settings.AGE_TOLERANCE
    
    age_diff = abs(age1 - age2)
    
    if age_diff == 0:
        return 100.0, f"Exact age match: {age1} years"
    elif age_diff <= tolerance:
        score = 100 - (age_diff / tolerance) * 30  # 70-100 range
        return score, f"Age within tolerance: {age1} vs {age2} (±{tolerance} years)"
    elif age_diff <= tolerance * 2:
        score = 70 - ((age_diff - tolerance) / tolerance) * 40  # 30-70 range
        return score, f"Age close but outside tolerance: {age1} vs {age2}"
    else:
        return 0.0, f"Age mismatch: {age1} vs {age2} (difference: {age_diff} years)"
def calculate_gender_score(gender1: str, gender2: str) -> Tuple[float, str]:
    """
    Calculate gender match score
    
    Returns: (score: 0-100, explanation: str)
    """
    if not gender1 or not gender2:
        return 50.0, "Gender information missing"
    
    if gender1.lower() == gender2.lower():
        return 100.0, f"Gender match: {gender1}"
    else:
        return 0.0, f"Gender mismatch: {gender1} vs {gender2}"
def calculate_physical_description_similarity(desc1: str, desc2: str) -> Tuple[float, str]:
    """
    Calculate physical description similarity
    Uses simple word overlap for now
    
    Returns: (score: 0-100, explanation: str)
    """
    if not desc1 or not desc2:
        return 50.0, "Physical description missing for one or both persons"
    
    # Normalize and tokenize
    words1 = set(desc1.lower().split())
    words2 = set(desc2.lower().split())
    
    # Calculate Jaccard similarity
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    if len(union) == 0:
        return 0.0, "No description overlap"
    
    similarity = (len(intersection) / len(union)) * 100
    
    if similarity >= 50:
        return similarity, f"High description similarity ({len(intersection)} matching keywords)"
    elif similarity >= 25:
        return similarity, f"Moderate description similarity ({len(intersection)} matching keywords)"
    else:
        return similarity, f"Low description similarity"
async def calculate_match_score(
    missing_person: Dict[str, Any],
    survivor: Dict[str, Any]
) -> Tuple[float, MatchFactors]:
    """
    Calculate comprehensive match score between missing person and survivor
    
    Returns: (confidence_score: 0-100, match_factors: MatchFactors)
    """
    
    # 1. Name similarity
    name_score, name_explanation = calculate_name_similarity(
        missing_person.get("name", ""),
        survivor.get("name", "")
    )
    
    # 2. Age overlap
    age_score, age_explanation = calculate_age_overlap(
        missing_person.get("age"),
        survivor.get("age")
    )
    
    # 3. Gender match
    gender_score, gender_explanation = calculate_gender_score(
        missing_person.get("gender", ""),
        survivor.get("gender", "")
    )
    
    # 4. Location proximity
    missing_loc = missing_person.get("last_seen_coordinates")
    survivor_loc = survivor.get("current_coordinates")
    
    if missing_loc and survivor_loc:
        location_score, location_explanation = calculate_location_proximity(
            missing_loc,
            survivor_loc,
            threshold_km=settings.LOCATION_THRESHOLD_KM
        )
    else:
        location_score = 50.0
        location_explanation = "Location data missing for proximity calculation"
    
    # 5. Physical description similarity
    physical_score, physical_explanation = calculate_physical_description_similarity(
        missing_person.get("physical_description", ""),
        survivor.get("physical_description", "")
    )
    
    # Calculate weighted final score
    weights = {
        "name": settings.NAME_SIMILARITY_WEIGHT,
        "age": settings.AGE_OVERLAP_WEIGHT,
        "gender": settings.GENDER_WEIGHT,
        "location": settings.LOCATION_PROXIMITY_WEIGHT,
        "physical": settings.PHYSICAL_DESC_WEIGHT
    }
    
    final_score = (
        name_score * weights["name"] +
        age_score * weights["age"] +
        gender_score * weights["gender"] +
        location_score * weights["location"] +
        physical_score * weights["physical"]
    )
    
    # Clamp to 0-100
    final_score = max(0.0, min(100.0, final_score))
    
    # Create match factors
    factors = MatchFactors(
        name_similarity_score=name_score,
        name_explanation=name_explanation,
        age_overlap_score=age_score,
        age_explanation=age_explanation,
        gender_score=gender_score,
        gender_explanation=gender_explanation,
        location_proximity_score=location_score,
        location_explanation=location_explanation,
        physical_desc_score=physical_score,
        physical_desc_explanation=physical_explanation
    )
    
    return final_score, factors
async def find_matches_for_missing_person(
    missing_person_id: str,
    min_confidence: float = 30.0
) -> List[ReunifyMatch]:
    """
    Find potential matches for a missing person
    Returns list of matches sorted by confidence score
    """
    try:
        # Get missing person
        missing_person = await db.missing_persons.find_one({"person_id": missing_person_id})
        if not missing_person:
            logger.error(f"Missing person not found: {missing_person_id}")
            return []
        
        # Get all survivors in the same disaster
        disaster_id = missing_person.get("disaster_id")
        survivors = await db.survivors.find({
            "disaster_id": disaster_id,
            "status": {"$in": ["searching", "found"]}
        }).to_list(length=1000)
        
        matches = []
        
        for survivor in survivors:
            # Calculate match score
            confidence_score, factors = await calculate_match_score(missing_person, survivor)
            
            # Only include if above minimum confidence
            if confidence_score >= min_confidence:
                match = ReunifyMatch(
                    match_id=str(uuid.uuid4()),
                    missing_person_id=missing_person_id,
                    survivor_id=survivor["survivor_id"],
                    confidence_score=confidence_score,
                    factors=factors
                )
                matches.append(match)
        
        # Sort by confidence score (highest first)
        matches.sort(key=lambda x: x.confidence_score, reverse=True)
        
        return matches
    
    except Exception as e:
        logger.error(f"Error finding matches: {e}")
        return []
async def find_matches_for_survivor(
    survivor_id: str,
    min_confidence: float = 30.0
) -> List[ReunifyMatch]:
    """
    Find potential matches for a survivor
    Returns list of matches sorted by confidence score
    """
    try:
        # Get survivor
        survivor = await db.survivors.find_one({"survivor_id": survivor_id})
        if not survivor:
            logger.error(f"Survivor not found: {survivor_id}")
            return []
        
        # Get all missing persons in the same disaster
        disaster_id = survivor.get("disaster_id")
        missing_persons = await db.missing_persons.find({
            "disaster_id": disaster_id,
            "status": {"$in": ["missing", "searching"]}
        }).to_list(length=1000)
        
        matches = []
        
        for missing_person in missing_persons:
            # Calculate match score
            confidence_score, factors = await calculate_match_score(missing_person, survivor)
            
            # Only include if above minimum confidence
            if confidence_score >= min_confidence:
                match = ReunifyMatch(
                    match_id=str(uuid.uuid4()),
                    missing_person_id=missing_person["person_id"],
                    survivor_id=survivor_id,
                    confidence_score=confidence_score,
                    factors=factors
                )
                matches.append(match)
        
        # Sort by confidence score (highest first)
        matches.sort(key=lambda x: x.confidence_score, reverse=True)
        
        return matches
    
    except Exception as e:
        logger.error(f"Error finding matches: {e}")
        return []