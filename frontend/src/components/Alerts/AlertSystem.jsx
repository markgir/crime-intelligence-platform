import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

const SEVERITY_LABELS = { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' };
const STATUS_LABELS = { active: 'Ativo', acknowledged: 'Reconhecido', resolved: 'Resolvido' };

const AlertSystem = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium', alert_type: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSeverity) params.severity = filterSeverity;
      const [alertsRes, statsRes] = await Promise.all([
        api.get('/alerts', { params }),
        api.get('/alerts/stats'),
      ]);
      setAlerts(alertsRes.data.alerts || []);
      setStats(statsRes.data.stats || {});
    } catch (err) {
      setError('Erro ao carregar alertas.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSeverity]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/alerts/${id}/${action}`);
      fetchAlerts();
    } catch (err) {
      setError(`Erro ao ${action === 'acknowledge' ? 'reconhecer' : 'resolver'} alerta.`);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.alert_type) return setFormError('Título e tipo são obrigatórios.');
    setSaving(true);
    setFormError('');
    try {
      await api.post('/alerts', form);
      setShowForm(false);
      setForm({ title: '', description: '', severity: 'medium', alert_type: '' });
      fetchAlerts();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao criar alerta.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este alerta?')) return;
    try {
      await api.delete(`/alerts/${id}`);
      fetchAlerts();
    } catch (err) {
      setError('Erro ao eliminar alerta.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔔 Sistema de Alertas</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Novo Alerta'}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">🔴 Críticos Ativos</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.critical_active || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🟠 Altos Ativos</div>
          <div className="stat-value" style={{ color: '#f97316' }}>{stats.high_active || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚡ Ativos Total</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.active || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ Resolvidos</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{stats.resolved || 0}</div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">Novo Alerta</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Título *</label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Título do alerta"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <input
                  className="form-control"
                  value={form.alert_type}
                  onChange={e => setForm({ ...form, alert_type: e.target.value })}
                  placeholder="ex: Suspeito Identificado, Nova Ocorrência..."
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Severidade</label>
                <select
                  className="form-control"
                  value={form.severity}
                  onChange={e => setForm({ ...form, severity: e.target.value })}
                >
                  <option value="low">Baixo</option>
                  <option value="medium">Médio</option>
                  <option value="high">Alto</option>
                  <option value="critical">Crítico</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input
                  className="form-control"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição detalhada..."
                />
              </div>
            </div>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ A guardar...' : '💾 Criar Alerta'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.8rem 1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#8899bb', fontSize: '0.85rem' }}>Filtrar:</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['', 'active', 'acknowledged', 'resolved'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="btn"
                style={{
                  background: filterStatus === s ? '#00d4ff' : '#1e2d4a',
                  color: filterStatus === s ? '#0a0f1e' : '#8899bb',
                  padding: '0.3rem 0.8rem', fontSize: '0.8rem',
                }}
              >
                {s === '' ? 'Todos' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['', 'critical', 'high', 'medium', 'low'].map(sv => (
              <button
                key={sv}
                onClick={() => setFilterSeverity(sv)}
                className="btn"
                style={{
                  background: filterSeverity === sv ? (SEVERITY_COLORS[sv] || '#00d4ff') : '#1e2d4a',
                  color: filterSeverity === sv ? 'white' : '#8899bb',
                  padding: '0.3rem 0.8rem', fontSize: '0.8rem',
                }}
              >
                {sv === '' ? 'Todas severidades' : SEVERITY_LABELS[sv]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ color: '#8899bb', padding: '2rem' }}>A carregar alertas...</div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#8899bb', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔕</div>
          <div>Sem alertas com os filtros selecionados.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {alerts.map(alert => (
            <div key={alert.id} className="card" style={{
              borderLeft: `4px solid ${SEVERITY_COLORS[alert.severity] || '#8899bb'}`,
              padding: '1rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span style={{
                      background: SEVERITY_COLORS[alert.severity],
                      color: 'white', padding: '0.1rem 0.5rem',
                      borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      {SEVERITY_LABELS[alert.severity] || alert.severity}
                    </span>
                    <span style={{ color: '#8899bb', fontSize: '0.8rem' }}>{alert.alert_type}</span>
                    <span style={{ color: '#8899bb', fontSize: '0.75rem' }}>
                      {new Date(alert.created_at).toLocaleString('pt-PT')}
                    </span>
                  </div>
                  <div style={{ color: '#e0e6f0', fontWeight: 600, marginBottom: '0.3rem' }}>{alert.title}</div>
                  {alert.description && (
                    <div style={{ color: '#8899bb', fontSize: '0.85rem' }}>{alert.description}</div>
                  )}
                  {alert.created_by_username && (
                    <div style={{ color: '#8899bb', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                      Criado por: {alert.created_by_username}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem' }}>
                  {alert.status === 'active' && (
                    <button
                      className="btn"
                      style={{ background: '#1e2d4a', color: '#f59e0b', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                      onClick={() => handleAction(alert.id, 'acknowledge')}
                      title="Reconhecer"
                    >
                      👁️
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      className="btn"
                      style={{ background: '#1e2d4a', color: '#22c55e', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                      onClick={() => handleAction(alert.id, 'resolve')}
                      title="Resolver"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="btn"
                    style={{ background: '#1e2d4a', color: '#ef4444', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => handleDelete(alert.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertSystem;
