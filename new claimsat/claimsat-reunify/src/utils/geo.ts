import type { Disaster } from '../models/types';
/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export const isPointInPolygon = (
  point: { lat: number; lng: number },
  polygon: number[][][]
): boolean => {
  // polygon[0] is the outer ring
  const ring = polygon[0];
  let inside = false;
  
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][1]; // lat
    const yi = ring[i][0]; // lng
    const xj = ring[j][1];
    const yj = ring[j][0];
    
    const intersect =
      yi > point.lng !== yj > point.lng &&
      point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi) + xi;
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};
/**
 * Calculate location match score (0-100)
 */
export const calculateLocationScore = (
  claimLocation: { lat: number; lng: number },
  disaster: Disaster
): { score: number; explanation: string; distance?: number } => {
  // Check if point is inside disaster polygon
  const isInside = isPointInPolygon(claimLocation, disaster.location.coordinates);
  
  if (isInside) {
    return {
      score: 100,
      explanation: 'Claim location is within the disaster-affected area',
    };
  }
  
  // Calculate distance from epicenter/center if available
  if (disaster.epicenter) {
    const distance = calculateDistance(
      claimLocation.lat,
      claimLocation.lng,
      disaster.epicenter.lat,
      disaster.epicenter.lng
    );
    
    // Score decreases with distance
    // 0-5km: 80-100 points
    // 5-20km: 50-80 points
    // 20-50km: 20-50 points
    // >50km: 0-20 points
    
    let score = 0;
    if (distance <= 5) {
      score = 80 + (5 - distance) * 4;
    } else if (distance <= 20) {
      score = 50 + (20 - distance) * 2;
    } else if (distance <= 50) {
      score = 20 + (50 - distance) * 0.6;
    } else {
      score = Math.max(0, 20 - (distance - 50) * 0.2);
    }
    
    return {
      score: Math.min(100, Math.max(0, score)),
      explanation: `Claim location is ${distance.toFixed(1)}km from disaster epicenter`,
      distance,
    };
  }
  
  // If no epicenter, calculate distance to polygon boundary
  return {
    score: 30,
    explanation: 'Claim location is outside the primary affected area',
  };
};
/**
 * Calculate centroid of a polygon
 */
export const calculatePolygonCenter = (polygon: number[][][]): { lat: number; lng: number } => {
  const ring = polygon[0];
  let latSum = 0;
  let lngSum = 0;
  
  ring.forEach(coord => {
    lngSum += coord[0];
    latSum += coord[1];
  });
  
  return {
    lat: latSum / ring.length,
    lng: lngSum / ring.length,
  };
};