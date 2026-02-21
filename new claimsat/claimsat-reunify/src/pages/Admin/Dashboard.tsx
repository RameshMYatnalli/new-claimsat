import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Claim } from '../../models/types';
import { STORAGE_KEYS } from '../../config/api';
import ScoreDisplay from '../../components/ScoreDisplay';
import { formatDate } from '../../utils/time';

const getStatusBadge = (status: string) => {
  const badges: Record<string, string> = {
    approved: 'bg-green-100 text-green-800',
    needs_review: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return badges[status] || 'bg-gray-100 text-gray-800';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    approved: 'Approved',
    needs_review: 'Needs Review',
    pending: 'Pending',
    rejected: 'Rejected',
  };
  return texts[status] || status;
};

const updateClaimStatus = (claimId: string, status: 'approved' | 'rejected'): void => {
  const stored = localStorage.getItem(STORAGE_KEYS.CLAIMS);
  if (!stored) return;
  const claims: Claim[] = JSON.parse(stored);
  const index = claims.findIndex(c => c.id === claimId);
  if (index === -1) return;
  claims[index] = {
    ...claims[index],
    status,
    reviewedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
};

const AdminDashboard: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'needs_review' | 'approved' | 'rejected'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadClaims = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.CLAIMS);
    if (stored) {
      const parsed: Claim[] = JSON.parse(stored);
      parsed.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setClaims(parsed);
    } else {
      setClaims([]);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const filteredClaims =
    filter === 'all' ? claims : claims.filter(c => c.status === filter);

  const handleApprove = (claimId: string) => {
    updateClaimStatus(claimId, 'approved');
    loadClaims();
    setExpandedId(null);
  };

  const handleReject = (claimId: string) => {
    updateClaimStatus(claimId, 'rejected');
    loadClaims();
    setExpandedId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Review submitted claims, view scores and details, then approve or reject.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-gray-500 text-sm mb-1">Total Claims</div>
          <div className="text-3xl font-bold text-gray-800">{claims.length}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="text-blue-700 text-sm mb-1">Pending</div>
          <div className="text-3xl font-bold text-blue-800">
            {claims.filter(c => c.status === 'pending').length}
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <div className="text-yellow-700 text-sm mb-1">Needs Review</div>
          <div className="text-3xl font-bold text-yellow-800">
            {claims.filter(c => c.status === 'needs_review').length}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="text-green-700 text-sm mb-1">Approved</div>
          <div className="text-3xl font-bold text-green-800">
            {claims.filter(c => c.status === 'approved').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'needs_review', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : getStatusText(status)}
            {status !== 'all' && ` (${claims.filter(c => c.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Claims list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredClaims.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {claims.length === 0
              ? 'No claims submitted yet. New claims will appear here after users submit from ClaimSat.'
              : `No claims with status: ${getStatusText(filter)}`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Claimant</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Disaster</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submitted</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClaims.map(claim => (
                  <React.Fragment key={claim.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{claim.claimantName}</div>
                        <div className="text-xs text-gray-500">{claim.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {claim.disasterName || claim.disasterId}
                      </td>
                      <td className="px-4 py-3">
                        <ScoreDisplay score={claim.score.overall} label="Score" size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(claim.status)}`}>
                          {getStatusText(claim.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(claim.submittedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === claim.id ? null : claim.id)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm mr-3"
                        >
                          {expandedId === claim.id ? 'Hide details' : 'View details'}
                        </button>
                        {(claim.status === 'pending' || claim.status === 'needs_review') && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(claim.id)}
                              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 mr-2"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(claim.id)}
                              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    {expandedId === claim.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">Claimant &amp; contact</h4>
                              <p className="text-gray-700">{claim.claimantName}</p>
                              <p className="text-gray-600">{claim.claimantContact}</p>
                              <p className="text-gray-600">{claim.claimantAddress}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">Claim details</h4>
                              <p><span className="text-gray-500">Property:</span> {claim.propertyType}</p>
                              <p><span className="text-gray-500">Incident:</span> {formatDate(claim.incidentDate)}</p>
                              <p><span className="text-gray-500">Location:</span> {claim.location?.address || `${claim.location?.lat}, ${claim.location?.lng}`}</p>
                              <p className="mt-2 text-gray-700">{claim.damageDescription}</p>
                            </div>
                            <div className="md:col-span-2">
                              <h4 className="font-semibold text-gray-800 mb-2">Score breakdown</h4>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <span className="text-gray-500 text-xs">Location</span>
                                  <div className="font-semibold">{claim.score.breakdown.locationMatch.toFixed(0)}</div>
                                </div>
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <span className="text-gray-500 text-xs">Time</span>
                                  <div className="font-semibold">{claim.score.breakdown.timeProximity.toFixed(0)}</div>
                                </div>
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <span className="text-gray-500 text-xs">Evidence type</span>
                                  <div className="font-semibold">{claim.score.breakdown.evidenceType.toFixed(0)}</div>
                                </div>
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <span className="text-gray-500 text-xs">Visual</span>
                                  <div className="font-semibold">{claim.score.breakdown.visualRelevance.toFixed(0)}</div>
                                </div>
                                <div className="bg-white rounded p-2 border border-gray-200">
                                  <span className="text-gray-500 text-xs">Metadata</span>
                                  <div className="font-semibold">{claim.score.breakdown.metadataIntegrity.toFixed(0)}</div>
                                </div>
                              </div>
                              <p className="text-gray-600 text-xs whitespace-pre-wrap">{claim.score.explanation}</p>
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                              <Link
                                to={`/claimsat/claim/${claim.id}`}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                              >
                                Open full claim view →
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
