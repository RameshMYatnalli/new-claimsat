import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ClaimSatDashboard from './pages/ClaimSat/Dashboard';
import NewClaim from './pages/ClaimSat/NewClaim';
import ClaimDetails from './pages/ClaimSat/ClaimDetails';
import ReunifyDashboard from './pages/Reunify/Dashboard';
import ReportMissing from './pages/Reunify/ReportMissing';
import ReportSurvivor from './pages/Reunify/ReportSurvivor';
import MatchDetails from './pages/Reunify/MatchDetails';
import AdminDashboard from './pages/Admin/Dashboard';
const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* ClaimSat Routes */}
          <Route path="/claimsat" element={<ClaimSatDashboard />} />
          <Route path="/claimsat/new" element={<NewClaim />} />
          <Route path="/claimsat/claim/:id" element={<ClaimDetails />} />
          
          {/* Reunify Routes */}
          <Route path="/reunify" element={<ReunifyDashboard />} />
          <Route path="/reunify/report-missing" element={<ReportMissing />} />
          <Route path="/reunify/report-survivor" element={<ReportSurvivor />} />
          <Route path="/reunify/match/:id" element={<MatchDetails />} />
        </Routes>
      </div>
    </Router>
  );
};
export default App;