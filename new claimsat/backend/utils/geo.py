"""
Geospatial Utilities
Functions for location-based calculations
"""
from typing import Dict, List, Tuple
from shapely.geometry import Point, Polygon
from math import radians, sin, cos, sqrt, atan2
import logging
logger = logging.getLogger(__name__)
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    
    a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    distance = R * c
    return distance
def point_in_polygon(point: Dict[str, float], polygon_coords: List[List[List[float]]]) -> bool:
    """
    Check if a point is inside a polygon
    point: {lat: float, lng: float}
    polygon_coords: GeoJSON coordinates [[[lon, lat], ...]]
    """
    try:
        # Convert point to shapely Point (lon, lat order)
        p = Point(point['lng'], point['lat'])
        
        # Convert polygon coordinates to shapely Polygon
        # GeoJSON uses [lon, lat] order
        exterior_ring = polygon_coords[0]
        poly = Polygon(exterior_ring)
        
        return poly.contains(p)
    
    except Exception as e:
        logger.error(f"Error checking point in polygon: {e}")
        return False
def calculate_location_score(
    claim_location: Dict[str, float],
    disaster_polygon: List[List[List[float]]],
    max_distance_km: float = 50.0
) -> Tuple[float, str]:
    """
    Calculate location score based on proximity to disaster zone
    Returns: (score: 0-100, explanation: str)
    """
    try:
        # Check if point is inside disaster zone
        if point_in_polygon(claim_location, disaster_polygon):
            return 100.0, "Location is within the disaster zone"
        
        # Calculate distance to nearest point on polygon
        claim_point = Point(claim_location['lng'], claim_location['lat'])
        disaster_poly = Polygon(disaster_polygon[0])
        
        # Get distance to polygon boundary
        distance_km = haversine_distance(
            claim_location['lat'],
            claim_location['lng'],
            disaster_poly.centroid.y,
            disaster_poly.centroid.x
        )
        
        if distance_km <= max_distance_km:
            # Linear decay: 100 at 0km, 50 at max_distance_km
            score = max(0, 100 - (distance_km / max_distance_km) * 50)
            return score, f"Location is {distance_km:.1f}km from disaster zone (within {max_distance_km}km threshold)"
        else:
            return 0.0, f"Location is {distance_km:.1f}km from disaster zone (exceeds {max_distance_km}km threshold)"
    
    except Exception as e:
        logger.error(f"Error calculating location score: {e}")
        return 50.0, "Unable to verify location proximity"
def calculate_location_proximity(
    loc1: Dict[str, float],
    loc2: Dict[str, float],
    threshold_km: float = 50.0
) -> Tuple[float, str]:
    """
    Calculate proximity score between two locations
    Returns: (score: 0-100, explanation: str)
    """
    try:
        distance_km = haversine_distance(
            loc1['lat'], loc1['lng'],
            loc2['lat'], loc2['lng']
        )
        
        if distance_km <= threshold_km:
            # Exponential decay for better sensitivity at close ranges
            score = 100 * (1 - (distance_km / threshold_km) ** 2)
            return score, f"Locations are {distance_km:.1f}km apart"
        else:
            return 0.0, f"Locations are {distance_km:.1f}km apart (exceeds {threshold_km}km threshold)"
    
    except Exception as e:
        logger.error(f"Error calculating location proximity: {e}")
        return 0.0, "Unable to calculate location proximity"