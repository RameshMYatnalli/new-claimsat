"""
Time Utilities
Functions for temporal calculations
"""
from datetime import datetime, timedelta
from typing import Tuple
import logging
logger = logging.getLogger(__name__)
def parse_iso_datetime(iso_string: str) -> datetime:
    """Parse ISO format datetime string"""
    try:
        # Handle both with and without microseconds
        if '.' in iso_string:
            return datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
        else:
            return datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
    except Exception as e:
        logger.error(f"Error parsing datetime: {e}")
        return datetime.utcnow()
def calculate_time_score(
    incident_time: str,
    disaster_start: str,
    disaster_end: str = None,
    max_days_before: int = 1,
    max_days_after: int = 30
) -> Tuple[float, str]:
    """
    Calculate time proximity score
    Returns: (score: 0-100, explanation: str)
    
    Scoring logic:
    - Within disaster period: 100
    - 1 day before: 80 (some pre-disaster damage is suspicious)
    - Within 30 days after: Linear decay from 100 to 50
    - Beyond thresholds: 0
    """
    try:
        incident_dt = parse_iso_datetime(incident_time)
        disaster_start_dt = parse_iso_datetime(disaster_start)
        disaster_end_dt = parse_iso_datetime(disaster_end) if disaster_end else datetime.utcnow()
        
        # Check if incident is within disaster period
        if disaster_start_dt <= incident_dt <= disaster_end_dt:
            duration = (disaster_end_dt - disaster_start_dt).days
            return 100.0, f"Incident occurred during disaster period ({duration} days duration)"
        
        # Check if incident is before disaster
        if incident_dt < disaster_start_dt:
            days_before = (disaster_start_dt - incident_dt).days
            if days_before <= max_days_before:
                score = max(0, 80 - (days_before * 20))
                return score, f"Incident occurred {days_before} day(s) before disaster (suspicious timing)"
            else:
                return 0.0, f"Incident occurred {days_before} days before disaster (too early)"
        
        # Check if incident is after disaster
        if incident_dt > disaster_end_dt:
            days_after = (incident_dt - disaster_end_dt).days
            if days_after <= max_days_after:
                # Linear decay: 100 at 0 days, 50 at max_days_after
                score = max(50, 100 - (days_after / max_days_after) * 50)
                return score, f"Incident occurred {days_after} day(s) after disaster ended (secondary damage possible)"
            else:
                return 0.0, f"Incident occurred {days_after} days after disaster (too late)"
    
    except Exception as e:
        logger.error(f"Error calculating time score: {e}")
        return 50.0, "Unable to verify time proximity"
def time_difference_hours(time1: str, time2: str) -> float:
    """Calculate time difference in hours"""
    try:
        dt1 = parse_iso_datetime(time1)
        dt2 = parse_iso_datetime(time2)
        diff = abs((dt2 - dt1).total_seconds() / 3600)
        return diff
    except Exception as e:
        logger.error(f"Error calculating time difference: {e}")
        return 0.0