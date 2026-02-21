import type { MissingPerson, Survivor, ReunifyMatch } from '../models/types';
import {
  calculateNameSimilarity,
  calculateAgeScore,
  calculateDescriptionSimilarity,
} from '../utils/fuzzy';
import { calculateDistance } from '../utils/geo';
/**
 * Match weights (must sum to 100)
 */
const WEIGHTS = {
  nameSimilarity: 30,
  ageOverlap: 20,
  genderMatch: 10,
  locationProximity: 25,
  physicalDescriptionSimilarity: 15,
};
/**
 * Find potential matches for a missing person
 */
export const findMatches = (
  missingPerson: MissingPerson,
  survivors: Survivor[]
): ReunifyMatch[] => {
  const matches: ReunifyMatch[] = [];
  
  survivors.forEach(survivor => {
    const match = calculateMatch(missingPerson, survivor);
    
    // Only include matches with confidence >= 40%
    if (match.confidenceScore >= 40) {
      matches.push(match);
    }
  });
  
  // Sort by confidence (highest first)
  return matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
};
/**
 * Calculate match confidence between missing person and survivor
 */
export const calculateMatch = (
  missingPerson: MissingPerson,
  survivor: Survivor
): ReunifyMatch => {
  // 1. Name Similarity
  const nameSimilarity = calculateNameSimilarity(
    missingPerson.person.name,
    survivor.person.name || ''
  );
  
  // 2. Age Overlap
  let ageOverlap = 0;
  if (survivor.person.age !== undefined) {
    ageOverlap = calculateAgeScore(missingPerson.person.age, survivor.person.age);
  } else {
    ageOverlap = 50; // Neutral if age unknown
  }
  
  // 3. Gender Match
  let genderMatch = 0;
  if (survivor.person.gender) {
    genderMatch = missingPerson.person.gender === survivor.person.gender ? 100 : 0;
  } else {
    genderMatch = 50; // Neutral if gender unknown
  }
  
  // 4. Location Proximity
  const locationProximity = calculateLocationProximity(
    missingPerson.lastSeenAt.coordinates,
    survivor.foundAt.coordinates
  );
  
  // 5. Physical Description Similarity
  let physicalDescriptionSimilarity = 0;
  if (survivor.person.physicalDescription) {
    physicalDescriptionSimilarity = calculateDescriptionSimilarity(
      missingPerson.person.physicalDescription,
      survivor.person.physicalDescription
    );
  } else {
    physicalDescriptionSimilarity = 50; // Neutral if no description
  }
  
  // Calculate weighted confidence score
  const confidenceScore =
    (nameSimilarity * WEIGHTS.nameSimilarity) / 100 +
    (ageOverlap * WEIGHTS.ageOverlap) / 100 +
    (genderMatch * WEIGHTS.genderMatch) / 100 +
    (locationProximity * WEIGHTS.locationProximity) / 100 +
    (physicalDescriptionSimilarity * WEIGHTS.physicalDescriptionSimilarity) / 100;
  
  const finalScore = Math.max(0, Math.min(100, confidenceScore));
  
  const explanation = generateMatchExplanation(
    finalScore,
    nameSimilarity,
    ageOverlap,
    genderMatch,
    locationProximity,
    missingPerson,
    survivor
  );
  
  return {
    id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    missingPersonId: missingPerson.id,
    survivorId: survivor.id,
    confidenceScore: Math.round(finalScore * 10) / 10,
    breakdown: {
      nameSimilarity: Math.round(nameSimilarity * 10) / 10,
      ageOverlap: Math.round(ageOverlap * 10) / 10,
      genderMatch: Math.round(genderMatch * 10) / 10,
      locationProximity: Math.round(locationProximity * 10) / 10,
      physicalDescriptionSimilarity: Math.round(physicalDescriptionSimilarity * 10) / 10,
    },
    explanation,
    matchedAt: new Date().toISOString(),
    status: 'pending_verification',
  };
};
/**
 * Calculate location proximity score
 */
const calculateLocationProximity = (
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number => {
  const distance = calculateDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
  
  // Score based on distance
  // 0-10km: 90-100 points
  // 10-50km: 60-90 points
  // 50-100km: 30-60 points
  // 100-200km: 10-30 points
  // >200km: 0-10 points
  
  let score = 0;
  if (distance <= 10) {
    score = 90 + (10 - distance);
  } else if (distance <= 50) {
    score = 60 + ((50 - distance) / 40) * 30;
  } else if (distance <= 100) {
    score = 30 + ((100 - distance) / 50) * 30;
  } else if (distance <= 200) {
    score = 10 + ((200 - distance) / 100) * 20;
  } else {
    score = Math.max(0, 10 - ((distance - 200) / 100));
  }
  
  return Math.max(0, Math.min(100, score));
};
/**
 * Generate match explanation
 */
const generateMatchExplanation = (
  overall: number,
  nameSimilarity: number,
  _ageOverlap: number,
  genderMatch: number,
  _locationProximity: number,
  missingPerson: MissingPerson,
  survivor: Survivor
): string => {
  let explanation = '';
  
  // Overall assessment
  if (overall >= 75) {
    explanation += '✓ HIGH MATCH CONFIDENCE: Strong indicators suggest this could be the same person. ';
  } else if (overall >= 60) {
    explanation += '⚠ GOOD MATCH: Moderate to strong indicators present. ';
  } else if (overall >= 40) {
    explanation += '⚠ POSSIBLE MATCH: Some indicators match but verification needed. ';
  } else {
    explanation += '✗ WEAK MATCH: Limited matching indicators. ';
  }
  
  explanation += '\n\n';
  
  // Name analysis
  if (nameSimilarity >= 90) {
    explanation += `👤 Name: Very strong match (${nameSimilarity.toFixed(0)}% similar)\n`;
  } else if (nameSimilarity >= 70) {
    explanation += `👤 Name: Partial match - could be nickname or variant (${nameSimilarity.toFixed(0)}% similar)\n`;
  } else {
    explanation += `👤 Name: Low similarity (${nameSimilarity.toFixed(0)}% similar)\n`;
  }
  
  // Age analysis
  if (survivor.person.age) {
    const ageDiff = Math.abs(missingPerson.person.age - survivor.person.age);
    if (ageDiff === 0) {
      explanation += `🎂 Age: Exact match (${missingPerson.person.age} years)\n`;
    } else if (ageDiff <= 3) {
      explanation += `🎂 Age: Very close (±${ageDiff} years)\n`;
    } else {
      explanation += `🎂 Age: Difference of ${ageDiff} years\n`;
    }
  } else {
    explanation += `🎂 Age: Survivor age not recorded\n`;
  }
  
  // Gender
  if (genderMatch === 100) {
    explanation += `⚧ Gender: Match\n`;
  } else if (survivor.person.gender) {
    explanation += `⚧ Gender: Mismatch\n`;
  } else {
    explanation += `⚧ Gender: Survivor gender not recorded\n`;
  }
  
  // Location
  const distance = calculateDistance(
    missingPerson.lastSeenAt.coordinates.lat,
    missingPerson.lastSeenAt.coordinates.lng,
    survivor.foundAt.coordinates.lat,
    survivor.foundAt.coordinates.lng
  );
  explanation += `📍 Location: ${distance.toFixed(1)}km apart\n`;
  
  explanation += '\n';
  explanation += '⚖️ IMPORTANT: This is an automated matching suggestion. Authority verification is MANDATORY before any reunion.';
  
  return explanation;
};