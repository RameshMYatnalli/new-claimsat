import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { MissingPerson, Survivor, ReunifyMatch } from '../../models/types';
import { STORAGE_KEYS } from '../../config/api';
import { findMatches } from '../../services/reunifyMatching';
import ScoreDisplay from '../../components/ScoreDisplay';
import { formatDate } from '../../utils/time';
const Dashboard: React.FC = () => {
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [survivors, setSurvivors] = useState<Survivor[]>([]);
  const [matches, setMatches] = useState<ReunifyMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'missing' | 'survivors' | 'matches'>('missing');
  useEffect(() => {
    loadData();
  }, []);
  const loadData = () => {
    const storedMissing = localStorage.getItem(STORAGE_KEYS.MISSING_PERSONS);
    const storedSurvivors = localStorage.getItem(STORAGE_KEYS.SURVIVORS);
    const storedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (storedMissing) {
      const parsed = JSON.parse(storedMissing);
      parsed.sort((a: MissingPerson, b: MissingPerson) => 
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
      );
      setMissingPersons(parsed);
    }
    if (storedSurvivors) {
      const parsed = JSON.parse(storedSurvivors);
      parsed.sort((a: Survivor, b: Survivor) => 
        new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
      );
      setSurvivors(parsed);
    }
    if (storedMatches) {
      const parsed = JSON.parse(storedMatches);
      parsed.sort((a: ReunifyMatch, b: ReunifyMatch) => 
        b.confidenceScore - a.confidenceScore
      );
      setMatches(parsed);
    }
  };
  const runMatching = () => {
    const allMatches: ReunifyMatch[] = [];
    
    missingPersons.forEach(missing => {
      if (missing.status === 'searching') {
        const foundMatches = findMatches(missing, survivors);
        allMatches.push(...foundMatches);
      }
    });
    // Remove duplicates and save
    const uniqueMatches = allMatches.filter((match, index, self) =>
      index === self.findIndex(m => 
        m.missingPersonId === match.missingPersonId && m.survivorId === match.survivorId
      )
    );
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(uniqueMatches));
    setMatches(uniqueMatches);
    setActiveTab('matches');
  };
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      searching: 'bg-yellow-100 text-yellow-800',
      found: 'bg-green-100 text-green-800',
      reunited: 'bg-blue-100 text-blue-800',
      registered: 'bg-blue-100 text-blue-800',
      matched: 'bg-purple-100 text-purple-800',
      pending_verification: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reunify Dashboard</h1>
          <p className="text-gray-600 mt-1">Missing persons and survivor reunification</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/reunify/report-missing"
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            + Report Missing
          </Link>
          <Link
            to="/reunify/report-survivor"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            + Register Survivor
          </Link>
        </div>
      </div>
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-orange-50 rounded-lg shadow p-6">
          <div className="text-orange-700 text-sm mb-1">Missing Persons</div>
          <div className="text-3xl font-bold text-orange-800">{missingPersons.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="text-green-700 text-sm mb-1">Registered Survivors</div>
          <div className="text-3xl font-bold text-green-800">{survivors.length}</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-6">
          <div className="text-purple-700 text-sm mb-1">Potential Matches</div>
          <div className="text-3xl font-bold text-purple-800">{matches.length}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="text-blue-700 text-sm mb-1">Reunited</div>
          <div className="text-3xl font-bold text-blue-800">
            {missingPersons.filter(m => m.status === 'reunited').length}
          </div>
        </div>
      </div>
      {/* Matching Button */}
      {missingPersons.length > 0 && survivors.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Automatic Matching</h3>
              <p className="text-sm text-gray-600">
                Run fuzzy matching algorithm to find potential reunifications
              </p>
            </div>
            <button
              onClick={runMatching}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              🔍 Run Matching
            </button>
          </div>
        </div>
      )}
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-2">
            <button
              onClick={() => setActiveTab('missing')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'missing'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Missing Persons ({missingPersons.length})
            </button>
            <button
              onClick={() => setActiveTab('survivors')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'survivors'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Survivors ({survivors.length})
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'matches'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Matches ({matches.length})
            </button>
          </div>
        </div>
        <div className="p-6">
          {/* Missing Persons Tab */}
          {activeTab === 'missing' && (
            <div className="space-y-4">
              {missingPersons.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No missing persons reported</h3>
                  <p className="text-gray-500 mb-6">Start by reporting a missing person</p>
                  <Link
                    to="/reunify/report-missing"
                    className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700"
                  >
                    Report Missing Person
                  </Link>
                </div>
              ) : (
                missingPersons.map(person => (
                  <div key={person.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{person.person.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(person.status)}`}>
                            {person.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>👤 Age: {person.person.age} • Gender: {person.person.gender}</div>
                          <div>📍 Last seen: {person.lastSeenAt.location}</div>
                          <div>⏰ {formatDate(person.lastSeenAt.timestamp)}</div>
                          <div className="text-xs text-gray-500">Reported by: {person.reportedBy.name} ({person.reportedBy.relationship})</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {/* Survivors Tab */}
          {activeTab === 'survivors' && (
            <div className="space-y-4">
              {survivors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No survivors registered</h3>
                  <p className="text-gray-500 mb-6">Register survivors to help reunify families</p>
                  <Link
                    to="/reunify/report-survivor"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Register Survivor
                  </Link>
                </div>
              ) : (
                survivors.map(survivor => (
                  <div key={survivor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">{survivor.person.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(survivor.status)}`}>
                            {survivor.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {survivor.person.age && <div>👤 Age: {survivor.person.age} • Gender: {survivor.person.gender}</div>}
                          <div>📍 Found at: {survivor.foundAt.location}</div>
                          {survivor.foundAt.shelterName && <div>🏠 Shelter: {survivor.foundAt.shelterName}</div>}
                          <div>⏰ {formatDate(survivor.foundAt.timestamp)}</div>
                          <div className="text-xs text-gray-500">Reported by: {survivor.reportedBy.organization}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No matches found yet</h3>
                  <p className="text-gray-500 mb-6">
                    {missingPersons.length === 0 || survivors.length === 0
                      ? 'You need both missing persons and survivors to run matching'
                      : 'Click "Run Matching" to find potential reunifications'
                    }
                  </p>
                </div>
              ) : (
                matches.map(match => {
                  const missing = missingPersons.find(m => m.id === match.missingPersonId);
                  const survivor = survivors.find(s => s.id === match.survivorId);
                  
                  if (!missing || !survivor) return null;
                  
                  return (
                    <Link
                      key={match.id}
                      to={`/reunify/match/${match.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <ScoreDisplay score={match.confidenceScore} label="Match Confidence" size="sm" />
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(match.status)}`}>
                            {match.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">MISSING PERSON</div>
                          <div className="font-semibold text-gray-800">{missing.person.name}</div>
                          <div className="text-gray-600">Age: {missing.person.age} • {missing.person.gender}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">SURVIVOR</div>
                          <div className="font-semibold text-gray-800">{survivor.person.name}</div>
                          <div className="text-gray-600">
                            {survivor.person.age && `Age: ${survivor.person.age} • `}
                            {survivor.person.gender}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;