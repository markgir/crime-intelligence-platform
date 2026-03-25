import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const EMPTY_FORM = { name: '', description: '', base_url: '', api_key: '', sync_interval_minutes: 60 };

const ExternalAPIs = () => {
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editApi, setEditApi] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const [testResults, setTestResults] = useState({});

  const fetchApis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/external-apis');
      setApis(res.data.apis || []);
    } catch (err) {
      setError('Erro ao carregar APIs externas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApis(); }, []);

  const handleNew = () => {
    setEditApi(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setFormError('');
  };

  const handleEdit = (apiItem) => {
    setEditApi(apiItem);
    setForm({
      name: apiItem.name || '',
      description: apiItem.description || '',
      base_url: apiItem.base_url || '',
      api_key: '',
      sync_interval_minutes: apiItem.sync_interval_minutes || 60,
    });
    setShowForm(true);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.base_url) return setFormError('Nome e URL base são obrigatórios.');
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form };
      if (!payload.api_key) delete payload.api_key;
      if (editApi) {
        await api.put(`/external-apis/${editApi.id}`, payload);
      } else {
        await api.post('/external-apis', payload);
      }
      setShowForm(false);
      setEditApi(null);
      fetchApis();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao guardar API.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar esta configuração de API?')) return;
    try {
      await api.delete(`/external-apis/${id}`);
      fetchApis();
    } catch (err) {
      setError('Erro ao eliminar API.');
    }
  };

  const handleTest = async (id) => {
    setTesting(id);
    setTestResults(prev => ({ ...prev, [id]: null }));
    try {
      const res = await api.post(`/external-apis/${id}/test`);
      setTestResults(prev => ({ ...prev, [id]: res.data }));
    } catch (err) {
      setTestResults(prev => ({ ...prev, [id]: { success: false, error: 'Erro de comunicação.' } }));
    } finally {
      setTesting(null);
    }
  };

  const handleToggle = async (apiItem) => {
    try {
      await api.put(`/external-apis/${apiItem.id}`, { is_active: !apiItem.is_active });
      fetchApis();
    } catch (err) {
      setError('Erro ao alterar estado da API.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔌 APIs Externas</h1>
        <button className="btn btn-primary" onClick={handleNew}>+ Nova API</button>
      </div>

      <p style={{ color: '#8899bb', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Configure integrações com APIs externas para sincronização de dados (bases de dados policiais, serviços governamentais, etc.).
      </p>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">{editApi ? 'Editar API' : 'Nova Integração API'}</div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome da integração" />
              </div>
              <div className="form-group">
                <label className="form-label">URL Base *</label>
                <input className="form-control" value={form.base_url} onChange={e => setForm({ ...form, base_url: e.target.value })} placeholder="https://api.exemplo.pt" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição da integração" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">API Key (deixe em branco para manter atual)</label>
                <input className="form-control" type="password" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder="••••••••" autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label className="form-label">Intervalo de Sincronização (minutos)</label>
                <input className="form-control" type="number" min="1" value={form.sync_interval_minutes} onChange={e => setForm({ ...form, sync_interval_minutes: parseInt(e.target.value) })} />
              </div>
            </div>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ A guardar...' : '💾 Guardar'}
              </button>
              <button type="button" className="btn" style={{ background: '#1e2d4a', color: '#8899bb' }} onClick={() => { setShowForm(false); setEditApi(null); }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ color: '#8899bb', padding: '2rem' }}>A carregar APIs...</div>
      ) : apis.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#8899bb', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔌</div>
          <div>Sem integrações configuradas.</div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleNew}>+ Adicionar Integração</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {apis.map(apiItem => (
            <div key={apiItem.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: '#e0e6f0', fontWeight: 600 }}>{apiItem.name}</span>
                    <span style={{
                      background: apiItem.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: apiItem.is_active ? '#22c55e' : '#ef4444',
                      padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                    }}>
                      {apiItem.is_active ? '● Ativa' : '○ Inativa'}
                    </span>
                  </div>
                  <div style={{ color: '#8899bb', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                    🌐 <a href={apiItem.base_url} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff' }}>
                      {apiItem.base_url}
                    </a>
                  </div>
                  {apiItem.description && (
                    <div style={{ color: '#8899bb', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{apiItem.description}</div>
                  )}
                  <div style={{ color: '#8899bb', fontSize: '0.75rem', display: 'flex', gap: '1rem' }}>
                    <span>🔄 {apiItem.sync_interval_minutes} min</span>
                    {apiItem.last_synced_at && (
                      <span>🕒 Última sinc: {new Date(apiItem.last_synced_at).toLocaleString('pt-PT')}</span>
                    )}
                  </div>

                  {testResults[apiItem.id] && (
                    <div style={{
                      marginTop: '0.5rem', padding: '0.5rem 0.8rem',
                      background: testResults[apiItem.id].success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      borderRadius: '4px', fontSize: '0.8rem',
                      color: testResults[apiItem.id].success ? '#22c55e' : '#ef4444',
                    }}>
                      {testResults[apiItem.id].success ? (
                        <>✅ Conexão bem-sucedida — HTTP {testResults[apiItem.id].status}</>
                      ) : (
                        <>❌ Falhou: {testResults[apiItem.id].error}</>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '1rem' }}>
                  <button
                    className="btn"
                    style={{ background: '#1e2d4a', color: '#f59e0b', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => handleTest(apiItem.id)}
                    disabled={testing === apiItem.id}
                    title="Testar Conexão"
                  >
                    {testing === apiItem.id ? '⏳' : '🧪'}
                  </button>
                  <button
                    className="btn"
                    style={{ background: '#1e2d4a', color: apiItem.is_active ? '#ef4444' : '#22c55e', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => handleToggle(apiItem)}
                    title={apiItem.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {apiItem.is_active ? '⏸' : '▶'}
                  </button>
                  <button
                    className="btn"
                    style={{ background: '#1e2d4a', color: '#00d4ff', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => handleEdit(apiItem)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn"
                    style={{ background: '#1e2d4a', color: '#ef4444', padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                    onClick={() => handleDelete(apiItem.id)}
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

export default ExternalAPIs;
