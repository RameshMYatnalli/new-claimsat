import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { Survivor, Disaster } from '../../models/types';
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
const ReportSurvivor: React.FC = () => {
  const navigate = useNavigate();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  
  // Form state - Reporter info
  const [organization, setOrganization] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  
  // Survivor info
  const [disasterId, setDisasterId] = useState('');
  const [personName, setPersonName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [physicalDescription, setPhysicalDescription] = useState('');
  const [medicalStatus, setMedicalStatus] = useState('');
  
  // Found location info
  const [foundLocation, setFoundLocation] = useState('');
  const [position, setPosition] = useState<[number, number]>([20.5937, 78.9629]);
  const [foundTime, setFoundTime] = useState('');
  const [shelterName, setShelterName] = useState('');
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
    const survivor: Survivor = {
      id: `survivor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportedBy: {
        organization,
        reporterName,
        contact: reporterContact,
      },
      disasterId,
      disasterName: selectedDisaster?.name,
      person: {
        name: personName,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        physicalDescription: physicalDescription || undefined,
        medicalStatus: medicalStatus || undefined,
      },
      foundAt: {
        location: foundLocation,
        coordinates: {
          lat: position[0],
          lng: position[1],
        },
        timestamp: foundTime,
        shelterName: shelterName || undefined,
      },
      reportedAt: new Date().toISOString(),
      status: 'registered',
    };
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.SURVIVORS) || '[]');
    existing.push(survivor);
    localStorage.setItem(STORAGE_KEYS.SURVIVORS, JSON.stringify(existing));
    navigate('/reunify');
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Register Survivor</h1>
        <p className="text-gray-600 mb-8">Register found survivors to help reunify with families</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reporter Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Reporter Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization *
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Red Cross, NDRF"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reporter Name *
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Your name"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
            </div>
          </div>
          {/* Survivor Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Survivor Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disaster Event *
                </label>
                <select
                  required
                  value={disasterId}
                  onChange={(e) => setDisasterId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Survivor's name (as told)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Age"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender (Optional)
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
                  Physical Description (Optional)
                </label>
                <textarea
                  value={physicalDescription}
                  onChange={(e) => setPhysicalDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Height, build, complexion, distinguishing features, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Status (Optional)
                </label>
                <input
                  type="text"
                  value={medicalStatus}
                  onChange={(e) => setMedicalStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Current medical condition or injuries"
                />
              </div>
            </div>
          </div>
          {/* Found Location Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Found Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={foundLocation}
                  onChange={(e) => setFoundLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Where was the survivor found?"
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
                  Date & Time Found *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={foundTime}
                  onChange={(e) => setFoundTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Shelter/Hospital (Optional)
                </label>
                <input
                  type="text"
                  value={shelterName}
                  onChange={(e) => setShelterName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Where is the survivor currently staying?"
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
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              Register Survivor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ReportSurvivor;