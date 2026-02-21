import React from 'react';
import { Link } from 'react-router-dom';
const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            ClaimSat + Reunify
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A unified disaster response platform for damage verification and family reunification
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* ClaimSat Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="text-5xl mb-4">🛰️</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">ClaimSat</h2>
            <p className="text-gray-600 mb-6">
              Post-disaster damage verification and pre-approval engine. Reduce manual assessment,
              prevent fraud, and provide explainable confidence scoring.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Multi-factor confidence scoring</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Geo-temporal verification</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Evidence analysis with explanations</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Authority-first decision support</span>
              </div>
            </div>
            <Link
              to="/claimsat"
              className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Open ClaimSat
            </Link>
          </div>
          {/* Reunify Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Reunify</h2>
            <p className="text-gray-600 mb-6">
              Missing persons and survivor reunification system. Help families reunite after
              disasters using fuzzy matching and authority verification.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Fuzzy name matching (no exact match required)</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Multi-attribute confidence scoring</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Location-based proximity matching</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Mandatory authority verification</span>
              </div>
            </div>
            <Link
              to="/reunify"
              className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Open Reunify
            </Link>
          </div>
        </div>
        {/* Key Principles */}
        <div className="max-w-4xl mx-auto mt-16 bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            System Philosophy
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🛡️</div>
              <h4 className="font-semibold text-gray-800 mb-2">Conservative</h4>
              <p className="text-sm text-gray-600">
                Prefers false negatives over false positives
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-800 mb-2">Explainable</h4>
              <p className="text-sm text-gray-600">
                Every score comes with detailed reasoning
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚖️</div>
              <h4 className="font-semibold text-gray-800 mb-2">Authority-First</h4>
              <p className="text-sm text-gray-600">
                Assists officials, never replaces them
              </p>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p className="text-sm">
            Built for real-world disaster response • Production-ready architecture
          </p>
        </div>
      </div>
    </div>
  );
};
export default Home;