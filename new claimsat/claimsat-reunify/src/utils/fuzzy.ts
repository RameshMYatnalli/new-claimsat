export const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
};
/**
 * Calculate similarity score between two strings (0-100)
 */
export const calculateStringSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  const similarity = ((maxLen - distance) / maxLen) * 100;
  
  return Math.max(0, similarity);
};
/**
 * Calculate name similarity with tokenization
 * Handles partial matches like "Ramesh" vs "Ramesh Kumar"
 */
export const calculateNameSimilarity = (name1: string, name2: string): number => {
  const tokens1 = name1.toLowerCase().trim().split(/\s+/);
  const tokens2 = name2.toLowerCase().trim().split(/\s+/);
  
  // Check for exact match
  if (name1.toLowerCase().trim() === name2.toLowerCase().trim()) {
    return 100;
  }
  
  // Check if one name is contained in the other
  const fullName1 = tokens1.join(' ');
  const fullName2 = tokens2.join(' ');
  
  if (fullName1.includes(fullName2) || fullName2.includes(fullName1)) {
    return 95;
  }
  
  // Calculate token-level matching
  let matchScore = 0;
  const allTokens = new Set([...tokens1, ...tokens2]);
  
  allTokens.forEach(token => {
    const in1 = tokens1.some(t => calculateStringSimilarity(t, token) > 80);
    const in2 = tokens2.some(t => calculateStringSimilarity(t, token) > 80);
    
    if (in1 && in2) {
      matchScore += 1;
    }
  });
  
  const tokenSimilarity = (matchScore / allTokens.size) * 100;
  
  // Also calculate overall string similarity
  const stringSimilarity = calculateStringSimilarity(name1, name2);
  
  // Return the higher of the two scores
  return Math.max(tokenSimilarity, stringSimilarity);
};
/**
 * Calculate age overlap score
 */
export const calculateAgeScore = (age1: number, age2: number): number => {
  const diff = Math.abs(age1 - age2);
  
  if (diff === 0) return 100;
  if (diff <= 3) return 90;
  if (diff <= 5) return 75;
  if (diff <= 10) return 50;
  if (diff <= 15) return 25;
  
  return 0;
};
/**
 * Calculate text similarity for physical descriptions
 */
export const calculateDescriptionSimilarity = (desc1: string, desc2: string): number => {
  if (!desc1 || !desc2) return 0;
  
  const tokens1 = desc1.toLowerCase().split(/\s+/);
  const tokens2 = desc2.toLowerCase().split(/\s+/);
  
  // Calculate Jaccard similarity
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  const jaccard = intersection.size === 0 || union.size === 0 ? 0 : (intersection.size / union.size) * 100;
  
  // Also calculate string similarity as fallback
  const stringSim = calculateStringSimilarity(desc1, desc2);
  
  return Math.max(jaccard, stringSim * 0.8);
};