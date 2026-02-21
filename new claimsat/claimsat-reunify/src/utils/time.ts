export const calculateTimeScore = (
  incidentDate: string,
  disasterStartDate: string,
  disasterEndDate?: string
): { score: number; explanation: string; daysDifference?: number } => {
  const incident = new Date(incidentDate);
  const start = new Date(disasterStartDate);
  const end = disasterEndDate ? new Date(disasterEndDate) : new Date();
  
  // Check if incident is within disaster period
  if (incident >= start && incident <= end) {
    return {
      score: 100,
      explanation: 'Incident date falls within the disaster period',
    };
  }
  
  // Calculate days difference from disaster start
  const diffTime = Math.abs(incident.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Score decreases with time difference
  // 0-3 days: 90-100 points
  // 3-7 days: 70-90 points
  // 7-14 days: 40-70 points
  // 14-30 days: 10-40 points
  // >30 days: 0-10 points
  
  let score = 0;
  if (diffDays <= 3) {
    score = 90 + (3 - diffDays) * 3.33;
  } else if (diffDays <= 7) {
    score = 70 + (7 - diffDays) * 5;
  } else if (diffDays <= 14) {
    score = 40 + (14 - diffDays) * 4.29;
  } else if (diffDays <= 30) {
    score = 10 + (30 - diffDays) * 1.88;
  } else {
    score = Math.max(0, 10 - (diffDays - 30) * 0.2);
  }
  
  const isBefore = incident < start;
  const explanation = isBefore
    ? `Incident date is ${diffDays} days before disaster start`
    : `Incident date is ${diffDays} days after disaster end`;
  
  return {
    score: Math.min(100, Math.max(0, score)),
    explanation,
    daysDifference: diffDays,
  };
};
/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
/**
 * Calculate relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};