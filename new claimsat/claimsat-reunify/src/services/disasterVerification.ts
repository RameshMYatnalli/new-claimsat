import type { Disaster } from '../models/types';
/**
 * Mock disaster database
 * In production, this would come from MongoDB
 */
export const MOCK_DISASTERS: Disaster[] = [
  {
    id: 'dis-001',
    name: 'Kerala Floods 2024',
    type: 'flood',
    location: {
      type: 'Polygon',
      coordinates: [
        [
          [76.2, 10.8],
          [76.5, 10.8],
          [76.5, 11.1],
          [76.2, 11.1],
          [76.2, 10.8],
        ],
      ],
    },
    epicenter: {
      lat: 10.95,
      lng: 76.35,
    },
    startDate: '2024-07-15T00:00:00Z',
    endDate: '2024-07-25T00:00:00Z',
    severity: 'critical',
    affectedArea: 2500,
    estimatedAffected: 150000,
    status: 'monitoring',
    description: 'Severe flooding in Wayanad and Idukki districts due to heavy monsoon rains',
  },
  {
    id: 'dis-002',
    name: 'Gujarat Earthquake 2024',
    type: 'earthquake',
    location: {
      type: 'Polygon',
      coordinates: [
        [
          [70.5, 22.5],
          [71.0, 22.5],
          [71.0, 23.0],
          [70.5, 23.0],
          [70.5, 22.5],
        ],
      ],
    },
    epicenter: {
      lat: 22.75,
      lng: 70.75,
    },
    startDate: '2024-06-10T14:30:00Z',
    severity: 'high',
    affectedArea: 1200,
    estimatedAffected: 80000,
    status: 'monitoring',
    description: 'Magnitude 5.8 earthquake centered near Bhachau',
  },
  {
    id: 'dis-003',
    name: 'Uttarakhand Landslides 2024',
    type: 'landslide',
    location: {
      type: 'Polygon',
      coordinates: [
        [
          [78.5, 30.2],
          [79.0, 30.2],
          [79.0, 30.7],
          [78.5, 30.7],
          [78.5, 30.2],
        ],
      ],
    },
    epicenter: {
      lat: 30.45,
      lng: 78.75,
    },
    startDate: '2024-08-01T00:00:00Z',
    endDate: '2024-08-05T00:00:00Z',
    severity: 'high',
    affectedArea: 800,
    estimatedAffected: 25000,
    status: 'active',
    description: 'Multiple landslides triggered by heavy rainfall in hill districts',
  },
];
/**
 * Get all active disasters
 */
export const getActiveDisasters = (): Disaster[] => {
  return MOCK_DISASTERS.filter(d => d.status === 'active' || d.status === 'monitoring');
};
/**
 * Get disaster by ID
 */
export const getDisasterById = (id: string): Disaster | undefined => {
  return MOCK_DISASTERS.find(d => d.id === id);
};
/**
 * Verify if a location and date match any active disaster
 */
export const verifyDisasterContext = (
  _location: { lat: number; lng: number },
  date: string
): { isValid: boolean; matchedDisasters: Disaster[] } => {
  const activeDisasters = getActiveDisasters();
  const incidentDate = new Date(date);
  
  const matchedDisasters = activeDisasters.filter(disaster => {
    const start = new Date(disaster.startDate);
    // Check time window (allow 30 days before/after)
    const timeDiff = Math.abs(incidentDate.getTime() - start.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    return daysDiff <= 30;
  });
  
  return {
    isValid: matchedDisasters.length > 0,
    matchedDisasters,
  };
};
