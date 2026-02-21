import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polygon } from 'react-leaflet';
import type { Claim, Disaster } from '../../models/types';
import { STORAGE_KEYS } from '../../config/api';
import { getDisasterById } from '../../services/disasterVerification';
import ScoreDisplay from '../../components/ScoreDisplay';
import { formatDate } from '../../utils/time';
import 'leaflet/dist/leaflet.css';
const ClaimDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [disaster, setDisaster] = useState<Disaster | null>(null);
  useEffect(() => {
    if (id) {
      loadClaim(id);
    }
  }, [id]);
  const loadClaim = (claimId: string) => {
    const stored = localStorage.getItem(STORAGE_KEYS.CLAIMS);
    if (stored) {
      const claims: Claim[] = JSON.parse(stored);
      const found = claims.find(c => c.id === claimId);
      if (found) {
        setClaim(found);
        const dis = getDisasterById(found.disasterId);
        setDisaster(dis || null);
      } else {
        navigate('/claimsat');
      }
    } else {
      navigate('/claimsat');
    }
  };
  if (!claim) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  const getStatusBadge = (status: string) => {
    const badges = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      needs_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };
  const getStatusText = (c: Claim) => {
    if (c.status === 'approved' && c.reviewedAt) return 'Approved';
    const texts: Record<string, string> = {
      approved: 'Pre-Approved',
      needs_review: 'Needs Review',
      pending: 'Pending',
      rejected: 'Rejected',
    };
    return texts[c.status] || c.status;
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/claimsat" className="text-primary-600 hover:text-primary-700">
          ← Back to Dashboard
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{claim.claimantName}</h1>
            <div className="text-sm text-gray-500">Claim ID: {claim.id}</div>
          </div>
          <div className="flex items-center space-x-4">
            <ScoreDisplay score={claim.score.overall} label="Confidence Score" size="lg" />
            <div className={`px-4 py-2 rounded-lg border-2 font-semibold ${getStatusBadge(claim.status)}`}>
              {getStatusText(claim)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Claimant Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Claimant Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Contact:</span>{' '}
                <span className="text-gray-800">{claim.claimantContact}</span>
              </div>
              <div>
                <span className="text-gray-500">Address:</span>{' '}
                <span className="text-gray-800">{claim.claimantAddress}</span>
              </div>
            </div>
          </div>
          {/* Claim Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Claim Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Disaster:</span>{' '}
                <span className="text-gray-800">{claim.disasterName}</span>
              </div>
              <div>
                <span className="text-gray-500">Property Type:</span>{' '}
                <span className="text-gray-800 capitalize">{claim.propertyType}</span>
              </div>
              <div>
                <span className="text-gray-500">Incident Date:</span>{' '}
                <span className="text-gray-800">{formatDate(claim.incidentDate)}</span>
              </div>
              <div>
                <span className="text-gray-500">Submitted:</span>{' '}
                <span className="text-gray-800">{formatDate(claim.submittedAt)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Damage Description</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{claim.damageDescription}</p>
        </div>
      </div>
      {/* Score Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Score Breakdown</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <ScoreDisplay 
              score={claim.score.breakdown.locationMatch} 
              label="Location Match" 
              size="sm" 
            />
          </div>
          <div className="text-center">
            <ScoreDisplay 
              score={claim.score.breakdown.timeProximity} 
              label="Time Proximity" 
              size="sm" 
            />
          </div>
          <div className="text-center">
            <ScoreDisplay 
              score={claim.score.breakdown.evidenceType} 
              label="Evidence Type" 
              size="sm" 
            />
          </div>
          <div className="text-center">
            <ScoreDisplay 
              score={claim.score.breakdown.visualRelevance} 
              label="Visual Relevance" 
              size="sm" 
            />
          </div>
          <div className="text-center">
            <ScoreDisplay 
              score={claim.score.breakdown.metadataIntegrity} 
              label="Metadata" 
              size="sm" 
            />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Explanation</h3>
          <div className="text-sm text-blue-800 whitespace-pre-line">{claim.score.explanation}</div>
        </div>
      </div>
      {/* Location Map */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Location</h2>
        <div className="mb-4 text-sm text-gray-600">
          📍 {claim.location.address}
        </div>
        <MapContainer
          center={[claim.location.lat, claim.location.lng]}
          zoom={10}
          style={{ height: '400px', borderRadius: '0.5rem' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[claim.location.lat, claim.location.lng]} />
          {disaster && (
            <Polygon
              positions={disaster.location.coordinates[0].map(coord => [coord[1], coord[0]])}
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.1 }}
            />
          )}
        </MapContainer>
      </div>
      {/* Evidence */}
      {claim.evidence.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Evidence ({claim.evidence.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {claim.evidence.map(evidence => (
              <div key={evidence.id} className="border border-gray-200 rounded-lg p-4">
                <div className="mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    evidence.type === 'video' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {evidence.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <div className="truncate">{evidence.filename}</div>
                  <div className="text-xs text-gray-500">
                    Uploaded: {formatDate(evidence.uploadedAt)}
                  </div>
                </div>
                {evidence.type === 'image' && (
                  <img 
                    src={evidence.fileUrl} 
                    alt={evidence.filename}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                {evidence.type === 'video' && (
                  <video 
                    src={evidence.fileUrl} 
                    controls
                    className="w-full rounded-lg mb-3"
                  />
                )}
                {evidence.analysisResult && (
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-1">Analysis Result:</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">Relevance Score:</span>
                      <span className="font-semibold text-sm">
                        {(evidence.analysisResult.visualRelevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {evidence.analysisResult.explanation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ClaimDetails;