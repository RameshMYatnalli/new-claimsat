"""
Claim Scoring Service
Multi-factor scoring engine with NO hard gates
"""
from typing import Dict, Any, Tuple
from models.claim import ClaimScore, ScoringFactors, ClaimStatus, Evidence, EvidenceType
from services.disaster_verification import verify_claim_against_disaster
from services.evidence_analysis import analyze_evidence
from core.config import settings
import logging
logger = logging.getLogger(__name__)
def calculate_evidence_type_score(evidence_list: list) -> Tuple[float, str]:
    """
    Calculate evidence type score
    Videos > Images > No evidence
    """
    if not evidence_list:
        return 0.0, "No evidence provided"
    
    has_video = any(e.get("type") == "video" for e in evidence_list)
    has_image = any(e.get("type") == "image" for e in evidence_list)
    
    if has_video:
        count = sum(1 for e in evidence_list if e.get("type") == "video")
        return 100.0, f"Video evidence provided ({count} video(s))"
    elif has_image:
        count = sum(1 for e in evidence_list if e.get("type") == "image")
        return 75.0, f"Image evidence provided ({count} image(s))"
    else:
        return 50.0, "Evidence provided but type unclear"
def calculate_metadata_integrity_score(evidence_list: list) -> Tuple[float, str]:
    """
    Calculate metadata integrity score
    Checks if evidence has proper metadata (capture time, location)
    """
    if not evidence_list:
        return 0.0, "No evidence to verify metadata"
    
    total_evidence = len(evidence_list)
    has_capture_time = sum(1 for e in evidence_list if e.get("capture_time"))
    has_location = sum(1 for e in evidence_list if e.get("location"))
    
    # Calculate percentage of evidence with metadata
    time_percentage = (has_capture_time / total_evidence) * 100
    location_percentage = (has_location / total_evidence) * 100
    
    avg_score = (time_percentage + location_percentage) / 2
    
    explanation = f"{has_capture_time}/{total_evidence} with timestamps, {has_location}/{total_evidence} with location data"
    
    return avg_score, explanation
async def calculate_claim_score(
    claim_location: Dict[str, float],
    incident_time: str,
    disaster_id: str,
    evidence_list: list,
    visual_analyses: Dict[str, Tuple[float, str]]
) -> ClaimScore:
    """
    Calculate comprehensive claim score using weighted factors
    
    NO HARD GATES - all factors contribute to final score
    """
    
    # 1. Verify against disaster (location + time)
    disaster, location_score, location_explanation, time_score, time_explanation = \
        await verify_claim_against_disaster(claim_location, incident_time, disaster_id)
    
    # 2. Evidence type score
    evidence_type_score, evidence_type_explanation = calculate_evidence_type_score(evidence_list)
    
    # 3. Visual relevance score (aggregate from all evidence)
    if visual_analyses:
        visual_scores = [score for score, _ in visual_analyses.values()]
        avg_visual_score = sum(visual_scores) / len(visual_scores) * 100  # Convert to 0-100
        
        # Collect explanations
        visual_explanations = [exp for _, exp in visual_analyses.values()]
        visual_explanation = "; ".join(visual_explanations[:2])  # First 2 to keep concise
    else:
        avg_visual_score = 50.0
        visual_explanation = "No visual analysis performed"
    
    # 4. Metadata integrity score
    metadata_score, metadata_explanation = calculate_metadata_integrity_score(evidence_list)
    
    # Calculate weighted final score
    weights = {
        "location": settings.LOCATION_WEIGHT,
        "time": settings.TIME_WEIGHT,
        "evidence_type": settings.EVIDENCE_TYPE_WEIGHT,
        "visual": settings.VISUAL_RELEVANCE_WEIGHT,
        "metadata": settings.METADATA_INTEGRITY_WEIGHT
    }
    
    final_score = (
        location_score * weights["location"] +
        time_score * weights["time"] +
        evidence_type_score * weights["evidence_type"] +
        avg_visual_score * weights["visual"] +
        metadata_score * weights["metadata"]
    )
    
    # Clamp to 0-100
    final_score = max(0.0, min(100.0, final_score))
    
    # Determine status based on score ranges
    if final_score >= 75:
        status = ClaimStatus.APPROVED
        status_explanation = "High confidence - claim appears legitimate"
    elif final_score >= 50:
        status = ClaimStatus.REVIEW_REQUIRED
        status_explanation = "Medium confidence - manual review recommended"
    elif final_score >= 25:
        status = ClaimStatus.REVIEW_REQUIRED
        status_explanation = "Low confidence - thorough review required"
    else:
        status = ClaimStatus.REJECTED
        status_explanation = "Very low confidence - likely invalid claim"
    
    # Build final explanation
    final_explanation = f"{status_explanation}. Score breakdown: "
    final_explanation += f"Location ({location_score:.1f}), "
    final_explanation += f"Time ({time_score:.1f}), "
    final_explanation += f"Evidence Type ({evidence_type_score:.1f}), "
    final_explanation += f"Visual ({avg_visual_score:.1f}), "
    final_explanation += f"Metadata ({metadata_score:.1f})"
    
    # Create scoring factors
    factors = ScoringFactors(
        location_score=location_score,
        location_explanation=location_explanation,
        time_score=time_score,
        time_explanation=time_explanation,
        evidence_type_score=evidence_type_score,
        evidence_type_explanation=evidence_type_explanation,
        visual_relevance_score=avg_visual_score,
        visual_relevance_explanation=visual_explanation,
        metadata_integrity_score=metadata_score,
        metadata_integrity_explanation=metadata_explanation
    )
    
    return ClaimScore(
        confidence_score=final_score,
        status=status,
        factors=factors,
        final_explanation=final_explanation
    )