import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../services/api';

const COLORS = ['#00d4ff', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PatternAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('hotspots');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/analytics/patterns');
        setData(res.data);
      } catch (err) {
        setError('Erro ao carregar análise de padrões.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '2rem', color: '#8899bb' }}>A analisar padrões...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return null;

  const timePatternHours = Array.from({ length: 24 }, (_, h) => {
    const found = data.time_patterns.find(t => parseInt(t.hour) === h);
    return { hour: `${String(h).padStart(2, '0')}h`, count: found ? parseInt(found.count) : 0 };
  });

  const dowPattern = DAYS_PT.map((day, i) => {
    const found = data.day_of_week_patterns.find(d => parseInt(d.dow_num) === i);
    return { day, count: found ? parseInt(found.count) : 0 };
  });

  const velocityData = data.crime_velocity.map(v => ({
    week: new Date(v.week).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
    count: parseInt(v.count),
  }));

  const tabs = [
    { id: 'hotspots', label: '📍 Hotspots' },
    { id: 'time', label: '⏰ Padrões Temporais' },
    { id: 'risk', label: '⚠️ Avaliação de Risco' },
    { id: 'velocity', label: '📈 Velocidade Criminal' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🧠 Análise de Padrões</h1>
        <span style={{ color: '#8899bb', fontSize: '0.85rem' }}>Análise estatística baseada em dados históricos</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              background: activeTab === tab.id ? '#00d4ff' : '#1e2d4a',
              color: activeTab === tab.id ? '#0a0f1e' : '#8899bb',
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'hotspots' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-title">📍 Top Localizações de Crime</div>
            {data.hotspots.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.hotspots.map(h => ({ name: h.location.slice(0, 25), count: parseInt(h.crime_count) }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                  <XAxis type="number" tick={{ fill: '#8899bb', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8899bb', fontSize: 10 }} width={110} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e0e6f0' }} />
                  <Bar dataKey="count" fill="#00d4ff" name="Crimes" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p style={{ color: '#8899bb' }}>Sem dados suficientes.</p>}
          </div>

          <div className="card">
            <div className="card-title">👤 Suspeitos Mais Frequentes</div>
            {data.suspect_network.length > 0 ? (
              <div>
                {data.suspect_network.slice(0, 8).map((s, i) => (
                  <div key={s.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0', borderBottom: '1px solid #1e2d4a',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        background: COLORS[i % COLORS.length], color: '#0a0f1e',
                        borderRadius: '50%', width: '24px', height: '24px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 'bold',
                      }}>{i + 1}</span>
                      <span style={{ color: '#e0e6f0' }}>{s.first_name} {s.last_name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{
                        background: '#1e2d4a', color: '#ef4444',
                        padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                      }}>
                        {s.crime_count} crime{s.crime_count !== '1' ? 's' : ''}
                      </span>
                      {s.max_confidence && (
                        <span style={{
                          background: s.max_confidence === 'high' ? 'rgba(239,68,68,0.2)' : s.max_confidence === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
                          color: s.max_confidence === 'high' ? '#ef4444' : s.max_confidence === 'medium' ? '#f59e0b' : '#22c55e',
                          padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                        }}>
                          {s.max_confidence}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: '#8899bb' }}>Sem dados suficientes.</p>}
          </div>
        </div>
      )}

      {activeTab === 'time' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-title">⏰ Crimes por Hora do Dia</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={timePatternHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                <XAxis dataKey="hour" tick={{ fill: '#8899bb', fontSize: 10 }} interval={2} />
                <YAxis tick={{ fill: '#8899bb', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e0e6f0' }} />
                <Bar dataKey="count" name="Crimes" radius={[4, 4, 0, 0]}>
                  {timePatternHours.map((entry, i) => (
                    <Cell key={i} fill={entry.count === Math.max(...timePatternHours.map(h => h.count)) ? '#ef4444' : '#00d4ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p style={{ color: '#8899bb', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
              🔴 Hora de pico identificada
            </p>
          </div>

          <div className="card">
            <div className="card-title">📅 Crimes por Dia da Semana</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dowPattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                <XAxis dataKey="day" tick={{ fill: '#8899bb', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8899bb', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e0e6f0' }} />
                <Bar dataKey="count" name="Crimes" radius={[4, 4, 0, 0]}>
                  {dowPattern.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'risk' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-title">⚠️ Avaliação de Risco por Suspeito</div>
            <p style={{ color: '#8899bb', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Baseado em casos abertos e nível de confiança das suspeitas.
            </p>
            {data.risk_assessment.length > 0 ? (
              <div>
                {data.risk_assessment.map((person, i) => {
                  const maxScore = Math.max(...data.risk_assessment.map(p => parseInt(p.risk_score)));
                  const pct = maxScore > 0 ? (parseInt(person.risk_score) / maxScore) * 100 : 0;
                  const color = pct > 75 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e';
                  return (
                    <div key={person.id} style={{ marginBottom: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ color: '#e0e6f0', fontSize: '0.9rem' }}>
                          {person.first_name} {person.last_name}
                        </span>
                        <span style={{ color, fontSize: '0.85rem', fontWeight: 600 }}>
                          Risco: {person.risk_score}
                        </span>
                      </div>
                      <div style={{ background: '#1e2d4a', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: '4px', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ color: '#8899bb', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                        {person.open_suspect_cases} caso{person.open_suspect_cases !== '1' ? 's' : ''} em aberto
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#8899bb' }}>Sem suspeitos com casos em aberto.</p>
            )}
          </div>

          <div className="card">
            <div className="card-title">🔄 Reincidência Criminal</div>
            <p style={{ color: '#8899bb', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Indivíduos associados a múltiplos crimes.
            </p>
            {data.recidivism.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#1e2d4a' }}>
                      <th style={{ padding: '0.5rem 0.6rem', color: '#8899bb', textAlign: 'left' }}>Nome</th>
                      <th style={{ padding: '0.5rem 0.6rem', color: '#ef4444', textAlign: 'center' }}>Suspeito</th>
                      <th style={{ padding: '0.5rem 0.6rem', color: '#f59e0b', textAlign: 'center' }}>Vítima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recidivism.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #1e2d4a' }}>
                        <td style={{ padding: '0.5rem 0.6rem', color: '#e0e6f0' }}>{p.first_name} {p.last_name}</td>
                        <td style={{ padding: '0.5rem 0.6rem', color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>{p.suspect_count}</td>
                        <td style={{ padding: '0.5rem 0.6rem', color: '#f59e0b', textAlign: 'center', fontWeight: 600 }}>{p.victim_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#8899bb' }}>Sem dados de reincidência.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'velocity' && (
        <div className="card">
          <div className="card-title">📈 Velocidade Criminal (Últimas 12 Semanas)</div>
          {velocityData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                  <XAxis dataKey="week" tick={{ fill: '#8899bb', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8899bb', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e0e6f0' }} />
                  <Line type="monotone" dataKey="count" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff', r: 4 }} name="Crimes" />
                </LineChart>
              </ResponsiveContainer>
              <p style={{ color: '#8899bb', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
                Tendência de ocorrências criminais nas últimas 12 semanas
              </p>
            </>
          ) : (
            <p style={{ color: '#8899bb' }}>Sem dados suficientes para o período selecionado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PatternAnalysis;
