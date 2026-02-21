import type { Evidence } from '../models/types';
/**
 * Analyze evidence file and generate relevance score
 * This is a LIGHTWEIGHT simulation - no actual CV processing
 * In production, this would use OpenCV backend
 */
export const analyzeEvidence = async (
  file: File,
  claimId: string
): Promise<Evidence> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate file hash (simple simulation)
  const fileHash = await generateFileHash(file);
  
  // Determine file type
  const type = file.type.startsWith('video/') ? 'video' : 'image';
  
  // Simulate visual analysis
  const analysisResult = simulateVisualAnalysis(file, type);
  
  const evidence: Evidence = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    claimId,
    type,
    filename: file.name,
    fileUrl: URL.createObjectURL(file),
    fileHash,
    uploadedAt: new Date().toISOString(),
    captureMetadata: {
      timestamp: new Date().toISOString(),
      device: 'Unknown',
    },
    analysisResult,
  };
  
  return evidence;
};
/**
 * Generate simple file hash
 */
const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
/**
 * Simulate visual analysis
 * In production, this would call OpenCV-based backend
 */
const simulateVisualAnalysis = (
  file: File,
  type: 'image' | 'video'
): { visualRelevanceScore: number; explanation: string; analyzedAt: string } => {
  const filename = file.name.toLowerCase();
  const size = file.size;
  
  let visualRelevanceScore = 0.5; // Default neutral score
  let explanation = '';
  
  // Heuristic-based scoring (NOT production-grade)
  // This is just for demonstration
  
  // Video files get slight boost
  if (type === 'video') {
    visualRelevanceScore += 0.15;
    explanation = 'Video evidence provides temporal context. ';
  } else {
    explanation = 'Static image evidence. ';
  }
  
  // File size heuristics (very rough)
  if (type === 'image') {
    if (size > 2000000) {
      // High resolution image
      visualRelevanceScore += 0.1;
      explanation += 'High resolution image detected. ';
    } else if (size < 100000) {
      // Very small image - might be low quality
      visualRelevanceScore -= 0.1;
      explanation += 'Low resolution image. ';
    }
  }
  
  // Filename heuristics (weak indicators)
  const relevantKeywords = ['damage', 'flood', 'destroyed', 'broken', 'disaster', 'aftermath'];
  const hasRelevantKeyword = relevantKeywords.some(kw => filename.includes(kw));
  
  if (hasRelevantKeyword) {
    visualRelevanceScore += 0.1;
    explanation += 'Filename suggests disaster-related content. ';
  }
  
  // Random/stock photo detection (very basic)
  const stockKeywords = ['sample', 'test', 'stock', 'demo', 'example'];
  const isLikelyStock = stockKeywords.some(kw => filename.includes(kw));
  
  if (isLikelyStock) {
    visualRelevanceScore -= 0.3;
    explanation += 'Possible stock/test image. ';
  }
  
  // Clamp score to 0-1
  visualRelevanceScore = Math.max(0, Math.min(1, visualRelevanceScore));
  
  // Add disclaimer
  explanation += 'Note: This is a lightweight heuristic analysis. Manual review recommended.';
  
  return {
    visualRelevanceScore,
    explanation: explanation.trim(),
    analyzedAt: new Date().toISOString(),
  };
};
/**
 * Calculate evidence type score based on evidence collection
 */
export const calculateEvidenceTypeScore = (evidence: Evidence[]): number => {
  if (evidence.length === 0) return 0;
  
  const hasVideo = evidence.some(e => e.type === 'video');
  const imageCount = evidence.filter(e => e.type === 'image').length;
  
  let score = 0;
  
  // Videos are more valuable
  if (hasVideo) {
    score = 90;
  } else if (imageCount >= 3) {
    score = 75;
  } else if (imageCount >= 1) {
    score = 60;
  }
  
  return score;
};
/**
 * Calculate visual relevance score from all evidence
 */
export const calculateVisualRelevanceScore = (evidence: Evidence[]): number => {
  if (evidence.length === 0) return 0;
  
  const analyzedEvidence = evidence.filter(e => e.analysisResult);
  
  if (analyzedEvidence.length === 0) return 50; // Neutral if not analyzed
  
  // Average the visual relevance scores
  const avgRelevance = analyzedEvidence.reduce(
    (sum, e) => sum + (e.analysisResult?.visualRelevanceScore || 0),
    0
  ) / analyzedEvidence.length;
  
  // Convert to 0-100 scale
  return avgRelevance * 100;
};
/**
 * Calculate metadata integrity score
 */
export const calculateMetadataIntegrityScore = (evidence: Evidence[]): number => {
  if (evidence.length === 0) return 0;
  
  let score = 70; // Base score
  
  const withTimestamp = evidence.filter(
    e => e.captureMetadata?.timestamp
  ).length;
  const withLocation = evidence.filter(
    e => e.captureMetadata?.location
  ).length;
  
  // Boost for metadata presence
  if (withTimestamp > 0) score += 10;
  if (withLocation > 0) score += 20;
  
  return Math.min(100, score);
};