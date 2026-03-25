import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS = {
  active: '#22c55e',
  inactive: '#ef4444',
  maintenance: '#f59e0b',
};

const STATUS_LABELS = { active: 'Ativa', inactive: 'Inativa', maintenance: 'Manutenção' };

const EMPTY_FORM = {
  name: '', location: '', latitude: '', longitude: '',
  stream_url: '', status: 'active', camera_type: '', notes: '', installed_at: '',
};

const CCTVManager = () => {
  const [cameras, setCameras] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editCamera, setEditCamera] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCamera, setSelectedCamera] = useState(null);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await api.get('/cameras', { params });
      setCameras(res.data.cameras || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError('Erro ao carregar câmeras.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchCameras(); }, [fetchCameras]);

  const handleEdit = (camera) => {
    setEditCamera(camera);
    setForm({
      name: camera.name || '',
      location: camera.location || '',
      latitude: camera.latitude || '',
      longitude: camera.longitude || '',
      stream_url: camera.stream_url || '',
      status: camera.status || 'active',
      camera_type: camera.camera_type || '',
      notes: camera.notes || '',
      installed_at: camera.installed_at ? camera.installed_at.slice(0, 10) : '',
    });
    setShowForm(true);
    setFormError('');
  };

  const handleNew = () => {
    setEditCamera(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.location) return setFormError('Nome e localização são obrigatórios.');
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form };
      if (payload.latitude) payload.latitude = parseFloat(payload.latitude);
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
      if (!payload.installed_at) delete payload.installed_at;
      if (editCamera) {
        await api.put(`/cameras/${editCamera.id}`, payload);
      } else {
        await api.post('/cameras', payload);
      }
      setShowForm(false);
      setEditCamera(null);
      fetchCameras();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao guardar câmera.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta câmera?')) return;
    try {
      await api.delete(`/cameras/${id}`);
      fetchCameras();
      if (selectedCamera?.id === id) setSelectedCamera(null);
    } catch (err) {
      setError('Erro ao eliminar câmera.');
    }
  };

  const activeCameras = cameras.filter(c => c.status === 'active').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📹 Câmeras CCTV</h1>
        <button className="btn btn-primary" onClick={handleNew}>+ Nova Câmera</button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">📹 Total Câmeras</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🟢 Ativas</div>
          <div className="stat-value" style={{ color: '#22c55e' }}>{activeCameras}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔴 Inativas/Manutenção</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{total - activeCameras}</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">{editCamera ? 'Editar Câmera' : 'Nova Câmera'}</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome da câmera" />
              </div>
              <div className="form-group">
                <label className="form-label">Localização *</label>
                <input className="form-control" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Endereço ou descrição" />
              </div>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-control" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="ex: 38.716" />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-control" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="ex: -9.139" />
              </div>
              <div className="form-group">
                <label className="form-label">URL do Stream</label>
                <input className="form-control" value={form.stream_url} onChange={e => setForm({ ...form, stream_url: e.target.value })} placeholder="rtsp://... ou http://..." />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de Câmera</label>
                <input className="form-control" value={form.camera_type} onChange={e => setForm({ ...form, camera_type: e.target.value })} placeholder="ex: Domo, Bala, PTZ..." />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                  <option value="maintenance">Manutenção</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data de Instalação</label>
                <input className="form-control" type="date" value={form.installed_at} onChange={e => setForm({ ...form, installed_at: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Observações..." />
            </div>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ A guardar...' : '💾 Guardar'}
              </button>
              <button type="button" className="btn" style={{ background: '#1e2d4a', color: '#8899bb' }} onClick={() => { setShowForm(false); setEditCamera(null); }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {['', 'active', 'inactive', 'maintenance'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="btn"
            style={{
              background: filterStatus === s ? (STATUS_COLORS[s] || '#00d4ff') : '#1e2d4a',
              color: filterStatus === s ? 'white' : '#8899bb',
              padding: '0.3rem 0.8rem', fontSize: '0.8rem',
            }}
          >
            {s === '' ? 'Todas' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ color: '#8899bb', padding: '2rem' }}>A carregar câmeras...</div>
      ) : cameras.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#8899bb', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
          <div>Sem câmeras registadas.</div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleNew}>
            + Adicionar Câmera
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {cameras.map(camera => (
            <div
              key={camera.id}
              className="card"
              style={{
                cursor: 'pointer',
                border: `1px solid ${selectedCamera?.id === camera.id ? '#00d4ff' : '#1e2d4a'}`,
                transition: 'border-color 0.2s',
              }}
              onClick={() => setSelectedCamera(selectedCamera?.id === camera.id ? null : camera)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📹</span>
                    <span style={{ color: '#e0e6f0', fontWeight: 600 }}>{camera.name}</span>
                    <span style={{
                      background: `${STATUS_COLORS[camera.status]}22`,
                      color: STATUS_COLORS[camera.status],
                      padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      {STATUS_LABELS[camera.status] || camera.status}
                    </span>
                  </div>
                  <div style={{ color: '#8899bb', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                    📍 {camera.location}
                  </div>
                  {camera.camera_type && (
                    <div style={{ color: '#8899bb', fontSize: '0.8rem' }}>Tipo: {camera.camera_type}</div>
                  )}
                  {camera.latitude && camera.longitude && (
                    <div style={{ color: '#8899bb', fontSize: '0.75rem' }}>
                      🌍 {parseFloat(camera.latitude).toFixed(4)}, {parseFloat(camera.longitude).toFixed(4)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn"
                    style={{ background: '#1e2d4a', color: '#00d4ff', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={e => { e.stopPropagation(); handleEdit(camera); }}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn"
                    style={{ background: '#1e2d4a', color: '#ef4444', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={e => { e.stopPropagation(); handleDelete(camera.id); }}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {selectedCamera?.id === camera.id && (
                <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #1e2d4a', fontSize: '0.8rem', color: '#8899bb' }}>
                  {camera.stream_url && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      🎥 Stream: <a href={camera.stream_url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff' }}>{camera.stream_url}</a>
                    </div>
                  )}
                  {camera.installed_at && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      📅 Instalada: {new Date(camera.installed_at).toLocaleDateString('pt-PT')}
                    </div>
                  )}
                  {camera.last_checked_at && (
                    <div style={{ marginBottom: '0.3rem' }}>
                      🔍 Verificada: {new Date(camera.last_checked_at).toLocaleString('pt-PT')}
                    </div>
                  )}
                  {camera.notes && <div>📝 {camera.notes}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CCTVManager;
