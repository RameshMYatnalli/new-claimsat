import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { Claim, Evidence, Disaster } from '../../models/types';
import { STORAGE_KEYS } from '../../config/api';
import { getActiveDisasters } from '../../services/disasterVerification';
import { analyzeEvidence } from '../../services/evidenceAnalysis';
import { calculateClaimScore, deriveClaimStatus } from '../../services/claimScoring';
import LoadingSpinner from '../../components/LoadingSpinner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
const LocationPicker: React.FC<{
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}> = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} />;
};
const NewClaim: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  
  // Form state
  const [claimantName, setClaimantName] = useState('');
  const [claimantContact, setClaimantContact] = useState('');
  const [claimantAddress, setClaimantAddress] = useState('');
  const [disasterId, setDisasterId] = useState('');
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial' | 'agricultural' | 'vehicle' | 'other'>('residential');
  const [damageDescription, setDamageDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]); // Center of India
  const [incidentDate, setIncidentDate] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  useEffect(() => {
    const activeDisasters = getActiveDisasters();
    setDisasters(activeDisasters);
    if (activeDisasters.length > 0) {
      setDisasterId(activeDisasters[0].id);
    }
  }, []);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidenceFiles(Array.from(e.target.files));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create claim ID
      const claimId = `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Process evidence files
      const processedEvidence: Evidence[] = [];
      for (const file of evidenceFiles) {
        const evidence = await analyzeEvidence(file, claimId);
        processedEvidence.push(evidence);
      }
      // Get selected disaster
      const selectedDisaster = disasters.find(d => d.id === disasterId);
      if (!selectedDisaster) {
        alert('Please select a disaster');
        setLoading(false);
        return;
      }
      // Create claim object (without score initially)
      const claim: Claim = {
        id: claimId,
        claimantName,
        claimantContact,
        claimantAddress,
        disasterId,
        disasterName: selectedDisaster.name,
        propertyType,
        damageDescription,
        location: {
          lat: position[0],
          lng: position[1],
          address: locationAddress,
        },
        incidentDate,
        submittedAt: new Date().toISOString(),
        evidence: processedEvidence,
        score: {
          overall: 0,
          breakdown: {
            locationMatch: 0,
            timeProximity: 0,
            evidenceType: 0,
            visualRelevance: 0,
            metadataIntegrity: 0,
          },
          explanation: '',
          calculatedAt: new Date().toISOString(),
        },
        status: 'pending',
      };
      // Calculate score
      const score = calculateClaimScore(claim, selectedDisaster, processedEvidence);
      claim.score = score;
      claim.status = deriveClaimStatus(score.overall);
      // Save to localStorage
      const existingClaims = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLAIMS) || '[]');
      existingClaims.push(claim);
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(existingClaims));
      // Save evidence separately
      const existingEvidence = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVIDENCE) || '[]');
      existingEvidence.push(...processedEvidence);
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(existingEvidence));
      // Navigate to claim details
      navigate(`/claimsat/claim/${claimId}`);
    } catch (error) {
      console.error('Error creating claim:', error);
      alert('Error creating claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  if (disasters.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-yellow-800 mb-2">No Active Disasters</h3>
          <p className="text-yellow-700">
            There are currently no active disasters in the system. Claims can only be filed for registered disasters.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">File New Claim</h1>
        <p className="text-gray-600 mb-8">Submit a damage claim for verification</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Claimant Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Claimant Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  value={claimantContact}
                  onChange={(e) => setClaimantContact(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  required
                  value={claimantAddress}
                  onChange={(e) => setClaimantAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your complete address"
                />
              </div>
            </div>
          </div>
          {/* Disaster & Property Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Disaster & Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disaster Event *
                </label>
                <select
                  required
                  value={disasterId}
                  onChange={(e) => setDisasterId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {disasters.map(disaster => (
                    <option key={disaster.id} value={disaster.id}>
                      {disaster.name} ({disaster.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type *
                </label>
                <select
                  required
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="agricultural">Agricultural</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Damage Description *
                </label>
                <textarea
                  required
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe the damage in detail"
                />
              </div>
            </div>
          </div>
          {/* Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Damage Location</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                required
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter damage location address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Click on map to set precise location
              </label>
              <MapContainer
                center={position}
                zoom={5}
                style={{ height: '400px', borderRadius: '0.5rem' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
              <div className="mt-2 text-sm text-gray-600">
                Selected: {position[0].toFixed(4)}, {position[1].toFixed(4)}
              </div>
            </div>
          </div>
          {/* Incident Date & Evidence */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Incident Date & Evidence</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evidence Files (Images/Videos)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {evidenceFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {evidenceFiles.length} file(s) selected
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/claimsat')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Submit Claim'}
            </button>
          </div>
        </form>
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <LoadingSpinner />
              <p className="mt-4 text-gray-700">Processing claim and analyzing evidence...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default NewClaim;