import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { MissingPerson, Disaster } from '../../models/types';
import { STORAGE_KEYS } from '../../config/api';
import { getActiveDisasters } from '../../services/disasterVerification';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix Leaflet icons
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
const ReportMissing: React.FC = () => {
  const navigate = useNavigate();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  
  // Form state - Reporter info
  const [reporterName, setReporterName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  
  // Missing person info
  const [disasterId, setDisasterId] = useState('');
  const [personName, setPersonName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [physicalDescription, setPhysicalDescription] = useState('');
  const [lastKnownClothing, setLastKnownClothing] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  
  // Last seen info
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]);
  const [lastSeenTime, setLastSeenTime] = useState('');
  const [circumstances, setCircumstances] = useState('');
  useEffect(() => {
    const activeDisasters = getActiveDisasters();
    setDisasters(activeDisasters);
    if (activeDisasters.length > 0) {
      setDisasterId(activeDisasters[0].id);
    }
  }, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDisaster = disasters.find(d => d.id === disasterId);
    const missingPerson: MissingPerson = {
      id: `missing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportedBy: {
        name: reporterName,
        relationship,
        contact: reporterContact,
      },
      disasterId,
      disasterName: selectedDisaster?.name,
      person: {
        name: personName,
        age: parseInt(age),
        gender,
        physicalDescription,
        lastKnownClothing: lastKnownClothing || undefined,
        medicalConditions: medicalConditions || undefined,
      },
      lastSeenAt: {
        location: lastSeenLocation,
        coordinates: {
          lat: position[0],
          lng: position[1],
        },
        timestamp: lastSeenTime,
        circumstances,
      },
      reportedAt: new Date().toISOString(),
      status: 'searching',
    };
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.MISSING_PERSONS) || '[]');
    existing.push(missingPerson);
    localStorage.setItem(STORAGE_KEYS.MISSING_PERSONS, JSON.stringify(existing));
    navigate('/reunify');
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Report Missing Person</h1>
        <p className="text-gray-600 mb-8">Help us reunify families by reporting missing persons</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporter Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Father, Brother"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  required
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </div>
          </div>
          {/* Missing Person Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Missing Person Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disaster Event *
                </label>
                <select
                  required
                  value={disasterId}
                  onChange={(e) => setDisasterId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {disasters.map(disaster => (
                    <option key={disaster.id} value={disaster.id}>
                      {disaster.name} ({disaster.type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Missing person's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="150"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Age"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <div className="flex space-x-4">
                  {(['male', 'female', 'other'] as const).map(g => (
                    <label key={g} className="flex items-center">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender === g}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="capitalize">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Physical Description *
                </label>
                <textarea
                  required
                  value={physicalDescription}
                  onChange={(e) => setPhysicalDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Height, build, complexion, distinguishing features, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Known Clothing (Optional)
                </label>
                <input
                  type="text"
                  value={lastKnownClothing}
                  onChange={(e) => setLastKnownClothing(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="What were they wearing?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions (Optional)
                </label>
                <input
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Any medical conditions or medications"
                />
              </div>
            </div>
          </div>
          {/* Last Seen Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Last Seen Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={lastSeenLocation}
                  onChange={(e) => setLastSeenLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Where were they last seen?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Click on map to mark location
                </label>
                <MapContainer
                  center={position}
                  zoom={5}
                  style={{ height: '300px', borderRadius: '0.5rem' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={lastSeenTime}
                  onChange={(e) => setLastSeenTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Circumstances *
                </label>
                <textarea
                  required
                  value={circumstances}
                  onChange={(e) => setCircumstances(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe the circumstances when they went missing"
                />
              </div>
            </div>
          </div>
          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/reunify')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ReportMissing;