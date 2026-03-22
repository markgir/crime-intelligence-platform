import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const COLORS = ['#00d4ff', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

const Dashboard = () => {
  const [stats, setStats] = useState({ people: 0, vehicles: 0, crimes: 0, openCrimes: 0, closedCrimes: 0 });
  const [crimesByType, setCrimesByType] = useState([]);
  const [crimesByMonth, setCrimesByMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [peopleRes, vehiclesRes, crimesRes] = await Promise.all([
          api.get('/people?limit=1'),
          api.get('/vehicles?limit=1'),
          api.get('/crimes?limit=100'),
        ]);

        const people = peopleRes.data.total || 0;
        const vehicles = vehiclesRes.data.total || 0;
        const crimes = crimesRes.data.crimes || [];
        const open = crimes.filter(c => c.status === 'open').length;
        const closed = crimes.filter(c => c.status === 'closed').length;
        setStats({ people, vehicles, crimes: crimesRes.data.total || crimes.length, openCrimes: open, closedCrimes: closed });

        // Crimes by type
        const typeMap = {};
        crimes.forEach(c => {
          const t = c.crime_type_name || 'Desconhecido';
          typeMap[t] = (typeMap[t] || 0) + 1;
        });
        setCrimesByType(Object.entries(typeMap).map(([name, value]) => ({ name, value })));

        // Crimes by month
        const monthMap = {};
        crimes.forEach(c => {
          const month = new Date(c.crime_date).toLocaleString('pt', { month: 'short', year: '2-digit' });
          monthMap[month] = (monthMap[month] || 0) + 1;
        });
        setCrimesByMonth(Object.entries(monthMap).map(([month, count]) => ({ month, count })).slice(-6));
      } catch (err) {
        setError('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: '#8899bb' }}>A carregar dashboard...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Dashboard OSINT</h1>
        <span style={{ color: '#8899bb', fontSize: '0.85rem' }}>Atualizado agora</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">👥 Total Pessoas</div>
          <div className="stat-value">{stats.people}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🚗 Total Veículos</div>
          <div className="stat-value">{stats.vehicles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🚨 Total Crimes</div>
          <div className="stat-value">{stats.crimes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔓 Crimes Abertos</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.openCrimes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ Crimes Encerrados</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{stats.closedCrimes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📈 Taxa Resolução</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {stats.crimes > 0 ? Math.round((stats.closedCrimes / stats.crimes) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-title">Crimes por Mês</div>
          {crimesByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={crimesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                <XAxis dataKey="month" tick={{ fill: '#8899bb', fontSize: 12 }} />
                <YAxis tick={{ fill: '#8899bb', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e0e6f0' }} />
                <Line type="monotone" dataKey="count" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff' }} name="Crimes" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#8899bb', fontSize: '0.85rem' }}>Sem dados suficientes.</p>}
        </div>

        <div className="card">
          <div className="card-title">Crimes por Tipo</div>
          {crimesByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={crimesByType} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {crimesByType.map((entry, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e0e6f0' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#8899bb', fontSize: '0.85rem' }}>Sem dados suficientes.</p>}
        </div>

        <div className="card">
          <div className="card-title">Top Tipos de Crime</div>
          {crimesByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={crimesByType.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                <XAxis type="number" tick={{ fill: '#8899bb', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8899bb', fontSize: 12 }} width={90} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e0e6f0' }} />
                <Bar dataKey="value" fill="#7c3aed" name="Crimes" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#8899bb', fontSize: '0.85rem' }}>Sem dados suficientes.</p>}
        </div>

        <div className="card">
          <div className="card-title">Estado dos Crimes</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: 'Aberto', count: stats.openCrimes },
              { name: 'Em Investigação', count: stats.crimes - stats.openCrimes - stats.closedCrimes },
              { name: 'Encerrado', count: stats.closedCrimes },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="name" tick={{ fill: '#8899bb', fontSize: 12 }} />
              <YAxis tick={{ fill: '#8899bb', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e0e6f0' }} />
              <Bar dataKey="count" name="Crimes" radius={[4, 4, 0, 0]}>
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
                <Cell fill="#22c55e" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
