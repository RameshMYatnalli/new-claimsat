import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import type { ReunifyMatch, MissingPerson, Survivor } from '../../models/types';
import { STORAGE_KEYS } from '../../config/api';
import ScoreDisplay from '../../components/ScoreDisplay';
import { formatDate } from '../../utils/time';
import { calculateDistance } from '../../utils/geo';
import 'leaflet/dist/leaflet.css';
const MatchDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<ReunifyMatch | null>(null);
  const [missingPerson, setMissingPerson] = useState<MissingPerson | null>(null);
  const [survivor, setSurvivor] = useState<Survivor | null>(null);
  useEffect(() => {
    if (id) {
      loadMatch(id);
    }
  }, [id]);
  const loadMatch = (matchId: string) => {
    const storedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
    const storedMissing = localStorage.getItem(STORAGE_KEYS.MISSING_PERSONS);
    const storedSurvivors = localStorage.getItem(STORAGE_KEYS.SURVIVORS);
    if (storedMatches && storedMissing && storedSurvivors) {
      const matches: ReunifyMatch[] = JSON.parse(storedMatches);
      const missing: MissingPerson[] = JSON.parse(storedMissing);
      const survivors: Survivor[] = JSON.parse(storedSurvivors);
      const foundMatch = matches.find(m => m.id === matchId);
      if (foundMatch) {
        setMatch(foundMatch);
        setMissingPerson(missing.find(m => m.id === foundMatch.missingPersonId) || null);
        setSurvivor(survivors.find(s => s.id === foundMatch.survivorId) || null);
      } else {
        navigate('/reunify');
      }
    } else {
      navigate('/reunify');
    }
  };
  if (!match || !missingPerson || !survivor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }
  const distance = calculateDistance(
    missingPerson.lastSeenAt.coordinates.lat,
    missingPerson.lastSeenAt.coordinates.lng,
    survivor.foundAt.coordinates.lat,
    survivor.foundAt.coordinates.lng
  );
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/reunify" className="text-primary-600 hover:text-primary-700">
          ← Back to Dashboard
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Match Details</h1>
            <div className="text-sm text-gray-500">Match ID: {match.id}</div>
          </div>
          <ScoreDisplay score={match.confidenceScore} label="Match Confidence" size="lg" />
        </div>
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <ScoreDisplay 
              score={match.breakdown.nameSimilarity} 
              label="Name Match" 
              size="sm" 
            />
          </div>
          <div className="text-center">
            <ScoreDisplay 
              score={match.breakdown.ageOverlap} 
              label="Age Match" 
              size="sm" 
            />
          </div>
          <div className="text-center">
            <ScoreDisplay 
              score={match.breakdown.genderMatch} 
              label="Gender Match" 
              size="sm" 
            />
          </div>
          <div className="text-center">
            <ScoreDisplay 
              score={match.breakdown.locationProximity} 
              label="Location" 
              size="sm" 
            />
          </div>
          <div className="text-center">
            <ScoreDisplay 
              score={match.breakdown.physicalDescriptionSimilarity} 
              label="Description" 
              size="sm" 
            />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-2">Match Explanation</h3>
          <div className="text-sm text-purple-800 whitespace-pre-line">{match.explanation}</div>
        </div>
      </div>
      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Missing Person */}
        <div className="bg-orange-50 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-orange-900 mb-4">Missing Person</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-orange-700 font-semibold">Name</div>
              <div className="text-lg text-gray-800">{missingPerson.person.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-orange-700 font-semibold">Age</div>
                <div className="text-gray-800">{missingPerson.person.age}</div>
              </div>
              <div>
                <div className="text-sm text-orange-700 font-semibold">Gender</div>
                <div className="text-gray-800 capitalize">{missingPerson.person.gender}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-orange-700 font-semibold">Physical Description</div>
              <div className="text-sm text-gray-700">{missingPerson.person.physicalDescription}</div>
            </div>
            {missingPerson.person.lastKnownClothing && (
              <div>
                <div className="text-sm text-orange-700 font-semibold">Last Known Clothing</div>
                <div className="text-sm text-gray-700">{missingPerson.person.lastKnownClothing}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-orange-700 font-semibold">Last Seen</div>
              <div className="text-sm text-gray-700">{missingPerson.lastSeenAt.location}</div>
              <div className="text-xs text-gray-600">{formatDate(missingPerson.lastSeenAt.timestamp)}</div>
            </div>
            <div>
              <div className="text-sm text-orange-700 font-semibold">Reported By</div>
              <div className="text-sm text-gray-700">
                {missingPerson.reportedBy.name} ({missingPerson.reportedBy.relationship})
              </div>
              <div className="text-xs text-gray-600">{missingPerson.reportedBy.contact}</div>
            </div>
          </div>
        </div>
        {/* Survivor */}
        <div className="bg-green-50 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Survivor</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-green-700 font-semibold">Name</div>
              <div className="text-lg text-gray-800">{survivor.person.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-green-700 font-semibold">Age</div>
                <div className="text-gray-800">{survivor.person.age || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-sm text-green-700 font-semibold">Gender</div>
                <div className="text-gray-800 capitalize">{survivor.person.gender || 'Unknown'}</div>
              </div>
            </div>
            {survivor.person.physicalDescription && (
              <div>
                <div className="text-sm text-green-700 font-semibold">Physical Description</div>
                <div className="text-sm text-gray-700">{survivor.person.physicalDescription}</div>
              </div>
            )}
            {survivor.person.medicalStatus && (
              <div>
                <div className="text-sm text-green-700 font-semibold">Medical Status</div>
                <div className="text-sm text-gray-700">{survivor.person.medicalStatus}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-green-700 font-semibold">Found At</div>
              <div className="text-sm text-gray-700">{survivor.foundAt.location}</div>
              <div className="text-xs text-gray-600">{formatDate(survivor.foundAt.timestamp)}</div>
            </div>
            {survivor.foundAt.shelterName && (
              <div>
                <div className="text-sm text-green-700 font-semibold">Current Location</div>
                <div className="text-sm text-gray-700">{survivor.foundAt.shelterName}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-green-700 font-semibold">Reported By</div>
              <div className="text-sm text-gray-700">
                {survivor.reportedBy.reporterName} ({survivor.reportedBy.organization})
              </div>
              <div className="text-xs text-gray-600">{survivor.reportedBy.contact}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Location Map */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Location Comparison</h2>
        <div className="mb-4 text-sm text-gray-600">
          Distance: {distance.toFixed(2)} km apart
        </div>
        <MapContainer
          center={[
            (missingPerson.lastSeenAt.coordinates.lat + survivor.foundAt.coordinates.lat) / 2,
            (missingPerson.lastSeenAt.coordinates.lng + survivor.foundAt.coordinates.lng) / 2,
          ]}
          zoom={8}
          style={{ height: '400px', borderRadius: '0.5rem' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker 
            position={[missingPerson.lastSeenAt.coordinates.lat, missingPerson.lastSeenAt.coordinates.lng]}
          />
          <Marker 
            position={[survivor.foundAt.coordinates.lat, survivor.foundAt.coordinates.lng]}
          />
          <Polyline
            positions={[
              [missingPerson.lastSeenAt.coordinates.lat, missingPerson.lastSeenAt.coordinates.lng],
              [survivor.foundAt.coordinates.lat, survivor.foundAt.coordinates.lng],
            ]}
            pathOptions={{ color: 'purple', weight: 3, dashArray: '10, 10' }}
          />
        </MapContainer>
      </div>
    </div>
  );
};
export default MatchDetails;