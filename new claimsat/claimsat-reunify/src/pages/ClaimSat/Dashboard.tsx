import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Claim } from '../../models/types';
import { STORAGE_KEYS } from '../../config/api';
import ScoreDisplay from '../../components/ScoreDisplay';
import { formatDate } from '../../utils/time';
const Dashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'needs_review' | 'rejected'>('all');

  const loadClaims = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.CLAIMS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Sort by submission date (newest first)
      parsed.sort((a: Claim, b: Claim) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setClaims(parsed);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  // Reload claims when page becomes visible (e.g. returning from Admin tab) so admin-approved status is shown
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadClaims();
    };
    const onFocus = () => loadClaims();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const filteredClaims = filter === 'all' 
    ? claims 
    : claims.filter(c => c.status === filter);
  const getStatusBadge = (status: string) => {
    const badges = {
      approved: 'bg-green-100 text-green-800',
      needs_review: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };
  const getStatusText = (claim: Claim) => {
    const status = claim.status;
    if (status === 'approved') {
      return claim.reviewedAt ? 'Approved' : 'Pre-Approved';
    }
    const texts: Record<string, string> = {
      needs_review: 'Needs Review',
      pending: 'Pending',
      rejected: 'Rejected',
    };
    return texts[status] || status;
  };

  const getFilterLabel = (status: string) => {
    const labels: Record<string, string> = {
      approved: 'Approved',
      needs_review: 'Needs Review',
      pending: 'Pending',
      rejected: 'Rejected',
    };
    return labels[status] || status;
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ClaimSat Dashboard</h1>
          <p className="text-gray-600 mt-1">Damage verification and claim management</p>
        </div>
        <Link
          to="/claimsat/new"
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          + New Claim
        </Link>
      </div>
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-1">Total Claims</div>
          <div className="text-3xl font-bold text-gray-800">{claims.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="text-green-700 text-sm mb-1">Approved</div>
          <div className="text-3xl font-bold text-green-800">
            {claims.filter(c => c.status === 'approved').length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <div className="text-yellow-700 text-sm mb-1">Needs Review</div>
          <div className="text-3xl font-bold text-yellow-800">
            {claims.filter(c => c.status === 'needs_review').length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="text-blue-700 text-sm mb-1">Pending</div>
          <div className="text-3xl font-bold text-blue-800">
            {claims.filter(c => c.status === 'pending').length}
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex space-x-2">
          {(['all', 'approved', 'needs_review', 'pending', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : getFilterLabel(status)}
              {status !== 'all' && ` (${claims.filter(c => c.status === status).length})`}
            </button>
          ))}
        </div>
      </div>
      {/* Claims List */}
      {filteredClaims.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No claims found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? 'Start by creating your first claim'
              : `No claims with status: ${getFilterLabel(filter)}`
            }
          </p>
          <Link
            to="/claimsat/new"
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700"
          >
            Create New Claim
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map(claim => (
            <Link
              key={claim.id}
              to={`/claimsat/claim/${claim.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {claim.claimantName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(claim.status)}`}>
                      {getStatusText(claim)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>📍 {claim.location.address}</div>
                    <div>🏗️ {claim.propertyType} • {claim.disasterName || 'Unknown Disaster'}</div>
                    <div>📅 Incident: {formatDate(claim.incidentDate)}</div>
                    <div className="text-xs text-gray-500">
                      Submitted: {formatDate(claim.submittedAt)}
                    </div>
                  </div>
                </div>
                <div className="ml-6">
                  <ScoreDisplay score={claim.score.overall} label="Confidence" size="md" />
                </div>
              </div>
              
              {claim.evidence.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    📎 {claim.evidence.length} evidence file(s) attached
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default Dashboard;