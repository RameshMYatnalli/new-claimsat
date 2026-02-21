import type { Claim, ClaimScore, Evidence, Disaster } from '../models/types';
import { calculateLocationScore } from '../utils/geo';
import { calculateTimeScore } from '../utils/time';
import {
  calculateEvidenceTypeScore,
  calculateVisualRelevanceScore,
  calculateMetadataIntegrityScore,
} from './evidenceAnalysis';
/**
 * Score weights (must sum to 100)
 */
const WEIGHTS = {
  locationMatch: 30,
  timeProximity: 20,
  evidenceType: 15,
  visualRelevance: 20,
  metadataIntegrity: 15,
};
/**
 * Calculate comprehensive claim score
 * This is the CORE scoring engine - must be stable and explainable
 */
export const calculateClaimScore = (
  claim: Claim,
  disaster: Disaster,
  evidence: Evidence[]
): ClaimScore => {
  // 1. Location Match Score
  const locationResult = calculateLocationScore(claim.location, disaster);
  const locationScore = locationResult.score;
  
  // 2. Time Proximity Score
  const timeResult = calculateTimeScore(
    claim.incidentDate,
    disaster.startDate,
    disaster.endDate
  );
  const timeScore = timeResult.score;
  
  // 3. Evidence Type Score
  const evidenceTypeScore = calculateEvidenceTypeScore(evidence);
  
  // 4. Visual Relevance Score
  const visualRelevanceScore = calculateVisualRelevanceScore(evidence);
  
  // 5. Metadata Integrity Score
  const metadataIntegrityScore = calculateMetadataIntegrityScore(evidence);
  
  // Calculate weighted overall score
  const overall =
    (locationScore * WEIGHTS.locationMatch) / 100 +
    (timeScore * WEIGHTS.timeProximity) / 100 +
    (evidenceTypeScore * WEIGHTS.evidenceType) / 100 +
    (visualRelevanceScore * WEIGHTS.visualRelevance) / 100 +
    (metadataIntegrityScore * WEIGHTS.metadataIntegrity) / 100;
  
  // Clamp to 0-100
  const finalScore = Math.max(0, Math.min(100, overall));
  
  // Generate explanation
  const explanation = generateScoreExplanation(
    finalScore,
    locationResult.explanation,
    timeResult.explanation,
    evidenceTypeScore,
    visualRelevanceScore,
    evidence.length
  );
  
  return {
    overall: Math.round(finalScore * 10) / 10, // Round to 1 decimal
    breakdown: {
      locationMatch: Math.round(locationScore * 10) / 10,
      timeProximity: Math.round(timeScore * 10) / 10,
      evidenceType: Math.round(evidenceTypeScore * 10) / 10,
      visualRelevance: Math.round(visualRelevanceScore * 10) / 10,
      metadataIntegrity: Math.round(metadataIntegrityScore * 10) / 10,
    },
    explanation,
    calculatedAt: new Date().toISOString(),
  };
};
/**
 * Generate human-readable explanation
 */
const generateScoreExplanation = (
  overall: number,
  locationExplanation: string,
  timeExplanation: string,
  evidenceTypeScore: number,
  visualRelevanceScore: number,
  evidenceCount: number
): string => {
  let explanation = '';
  
  // Overall assessment
  if (overall >= 75) {
    explanation += '✓ HIGH CONFIDENCE: This claim shows strong indicators of validity. ';
  } else if (overall >= 50) {
    explanation += '⚠ NEEDS REVIEW: This claim has moderate confidence and requires manual verification. ';
  } else if (overall >= 25) {
    explanation += '⚠ LOW CONFIDENCE: This claim has weak indicators and needs careful review. ';
  } else {
    explanation += '✗ VERY LOW CONFIDENCE: This claim has significant concerns. ';
  }
  
  explanation += '\n\n';
  
  // Location
  explanation += `📍 Location: ${locationExplanation}\n`;
  
  // Time
  explanation += `⏰ Timing: ${timeExplanation}\n`;
  
  // Evidence
  explanation += `📎 Evidence: ${evidenceCount} file(s) submitted`;
  if (evidenceTypeScore >= 75) {
    explanation += ' (strong evidence collection)';
  } else if (evidenceTypeScore >= 50) {
    explanation += ' (moderate evidence)';
  } else {
    explanation += ' (limited evidence)';
  }
  explanation += '\n';
  
  // Visual Analysis
  if (visualRelevanceScore >= 70) {
    explanation += '🔍 Visual Analysis: Evidence appears relevant to disaster context\n';
  } else if (visualRelevanceScore >= 40) {
    explanation += '🔍 Visual Analysis: Evidence relevance is uncertain\n';
  } else {
    explanation += '🔍 Visual Analysis: Evidence may not be disaster-related\n';
  }
  
  explanation += '\n';
  explanation += '⚖️ Final Decision: This is a preliminary assessment. Human authority must review and make final judgment.';
  
  return explanation;
};
/**
 * Derive claim status from score
 */
export const deriveClaimStatus = (
  score: number
): 'pending' | 'approved' | 'needs_review' | 'rejected' => {
  if (score >= 75) return 'approved';
  if (score >= 50) return 'needs_review';
  if (score >= 25) return 'pending';
  return 'rejected';
};