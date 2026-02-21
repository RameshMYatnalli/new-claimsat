export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    // ClaimSat
    CLAIMS: '/api/claims',
    EVIDENCE: '/api/evidence',
    DISASTERS: '/api/disasters',
    
    // Reunify
    MISSING_PERSONS: '/api/reunify/missing',
    SURVIVORS: '/api/reunify/survivors',
    MATCHES: '/api/reunify/matches',
  },
};
// Storage Keys
export const STORAGE_KEYS = {
  CLAIMS: 'claimsat_claims',
  EVIDENCE: 'claimsat_evidence',
  DISASTERS: 'claimsat_disasters',
  CLAIM_EVENTS: 'claimsat_events',
  MISSING_PERSONS: 'reunify_missing',
  SURVIVORS: 'reunify_survivors',
  MATCHES: 'reunify_matches',
};
// Score Thresholds
export const SCORE_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
};
// Status Derivation Rules
export const deriveStatus = (score: number): 'pending' | 'approved' | 'needs_review' | 'rejected' => {
  if (score >= 75) return 'approved';
  if (score >= 50) return 'needs_review';
  if (score >= 25) return 'pending';
  return 'rejected';
};