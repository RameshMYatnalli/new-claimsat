export interface Disaster {
  id: string;
  name: string;
  type: 'flood' | 'earthquake' | 'cyclone' | 'fire' | 'landslide' | 'other';
  location: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  epicenter?: {
    lat: number;
    lng: number;
  };
  startDate: string;
  endDate?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedArea: number; // in sq km
  estimatedAffected: number;
  status: 'active' | 'monitoring' | 'resolved';
  description: string;
}
// ClaimSat Models
export interface Claim {
  id: string;
  claimantName: string;
  claimantContact: string;
  claimantAddress: string;
  disasterId: string;
  disasterName?: string;
  propertyType: 'residential' | 'commercial' | 'agricultural' | 'vehicle' | 'other';
  damageDescription: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  incidentDate: string;
  submittedAt: string;
  evidence: Evidence[];
  score: ClaimScore;
  status: 'pending' | 'approved' | 'needs_review' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}
export interface Evidence {
  id: string;
  claimId: string;
  type: 'image' | 'video';
  filename: string;
  fileUrl: string;
  fileHash: string;
  uploadedAt: string;
  captureMetadata?: {
    timestamp?: string;
    location?: { lat: number; lng: number };
    device?: string;
  };
  analysisResult?: {
    visualRelevanceScore: number;
    explanation: string;
    analyzedAt: string;
  };
}
export interface ClaimScore {
  overall: number;
  breakdown: {
    locationMatch: number;
    timeProximity: number;
    evidenceType: number;
    visualRelevance: number;
    metadataIntegrity: number;
  };
  explanation: string;
  calculatedAt: string;
}
export interface ClaimEvent {
  id: string;
  claimId: string;
  eventType: 'created' | 'evidence_added' | 'scored' | 'status_changed' | 'reviewed';
  timestamp: string;
  data: any;
  performedBy?: string;
}
// Reunify Models
export interface MissingPerson {
  id: string;
  reportedBy: {
    name: string;
    relationship: string;
    contact: string;
  };
  disasterId: string;
  disasterName?: string;
  person: {
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    physicalDescription: string;
    lastKnownClothing?: string;
    medicalConditions?: string;
    photo?: string;
  };
  lastSeenAt: {
    location: string;
    coordinates: { lat: number; lng: number };
    timestamp: string;
    circumstances: string;
  };
  reportedAt: string;
  status: 'searching' | 'found' | 'reunited' | 'closed';
}
export interface Survivor {
  id: string;
  reportedBy: {
    organization: string;
    reporterName: string;
    contact: string;
  };
  disasterId: string;
  disasterName?: string;
  person: {
    name: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    physicalDescription?: string;
    medicalStatus?: string;
    photo?: string;
  };
  foundAt: {
    location: string;
    coordinates: { lat: number; lng: number };
    timestamp: string;
    shelterName?: string;
  };
  reportedAt: string;
  status: 'registered' | 'matched' | 'reunited' | 'transferred';
}
export interface ReunifyMatch {
  id: string;
  missingPersonId: string;
  survivorId: string;
  confidenceScore: number;
  breakdown: {
    nameSimilarity: number;
    ageOverlap: number;
    genderMatch: number;
    locationProximity: number;
    physicalDescriptionSimilarity: number;
  };
  explanation: string;
  matchedAt: string;
  status: 'pending_verification' | 'verified' | 'rejected' | 'reunited';
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
}
