import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import PeopleList from './components/People/PeopleList';
import VehicleList from './components/Vehicles/VehicleList';
import CrimeList from './components/Crimes/CrimeList';
import RelationshipGraph from './components/Relationships/RelationshipGraph';
import BackupManager from './components/Backups/BackupManager';
import ImportManager from './components/Import/ImportManager';
import AlertSystem from './components/Alerts/AlertSystem';
import PatternAnalysis from './components/Analytics/PatternAnalysis';
import GeoMap from './components/GeoMap/GeoMap';
import ReportGenerator from './components/Reports/ReportGenerator';
import CCTVManager from './components/CCTV/CCTVManager';
import ExternalAPIs from './components/ExternalAPIs/ExternalAPIs';
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const NavBar = ({ onLogout }) => {
  const location = useLocation();
  const navLinks = [
    { to: '/', label: '📊 Dashboard' },
    { to: '/people', label: '👥 Pessoas' },
    { to: '/vehicles', label: '🚗 Veículos' },
    { to: '/crimes', label: '🚨 Crimes' },
    { to: '/relationships', label: '🔗 Relações' },
    { to: '/alerts', label: '🔔 Alertas' },
    { to: '/import', label: '📥 Importar' },
    { to: '/analytics', label: '🧠 Padrões' },
    { to: '/geomap', label: '🗺️ Mapa' },
    { to: '/reports', label: '📄 Relatórios' },
    { to: '/cameras', label: '📹 CCTV' },
    { to: '/external-apis', label: '🔌 APIs' },
    { to: '/backups', label: '💾 Backups' },
  ];
  return (
    <nav className="navbar">
      <div className="navbar-brand">🔍 Crime Intelligence Platform</div>
      <ul className="navbar-links">
        {navLinks.map(link => (
          <li key={link.to}>
            <Link to={link.to} className={location.pathname === link.to ? 'active' : ''}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <button className="btn-logout" onClick={onLogout}>Sair</button>
    </nav>
  );
};

const AppLayout = ({ onLogout, children }) => (
  <div className="app-layout">
    <NavBar onLogout={onLogout} />
    <main className="app-main">{children}</main>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(process.env.REACT_APP_JWT_STORAGE_KEY || 'token'));

  useEffect(() => {
    const handleStorage = () => setIsAuthenticated(!!localStorage.getItem('token'));
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const TOKEN_KEY = process.env.REACT_APP_JWT_STORAGE_KEY || 'token';

  const handleLogin = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/*" element={
          <PrivateRoute>
            <AppLayout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/people" element={<PeopleList />} />
                <Route path="/vehicles" element={<VehicleList />} />
                <Route path="/crimes" element={<CrimeList />} />
                <Route path="/relationships" element={<RelationshipGraph />} />
                <Route path="/backups" element={<BackupManager />} />
                <Route path="/import" element={<ImportManager />} />
                <Route path="/alerts" element={<AlertSystem />} />
                <Route path="/analytics" element={<PatternAnalysis />} />
                <Route path="/geomap" element={<GeoMap />} />
                <Route path="/reports" element={<ReportGenerator />} />
                <Route path="/cameras" element={<CCTVManager />} />
                <Route path="/external-apis" element={<ExternalAPIs />} />
              </Routes>
            </AppLayout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
