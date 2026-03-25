import React, { useState, useRef } from 'react';
import api from '../../services/api';

const TARGET_OPTIONS = [
  { value: 'people', label: '👥 Pessoas' },
  { value: 'vehicles', label: '🚗 Veículos' },
  { value: 'crimes', label: '🚨 Crimes' },
];

const COLUMN_HINTS = {
  people: ['first_name', 'last_name', 'date_of_birth', 'id_number', 'nationality', 'notes'],
  vehicles: ['registration_plate', 'brand', 'model', 'color', 'vehicle_type', 'notes'],
  crimes: ['location', 'latitude', 'longitude', 'crime_date', 'description', 'status'],
};

const ImportManager = () => {
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState('people');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('import');
  const fileRef = useRef();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError('');
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return setError('Por favor selecione um ficheiro.');
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target', target);
      const res = await api.post('/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao importar ficheiro.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/import/logs');
      setLogs(res.data.logs || []);
    } catch (err) {
      setError('Erro ao carregar histórico de importações.');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') fetchLogs();
  };

  const statusColor = (status) => {
    const colors = { completed: '#22c55e', failed: '#ef4444', processing: '#f59e0b', pending: '#8899bb' };
    return colors[status] || '#8899bb';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📥 Importação de Dados</h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'import', label: '📤 Importar Ficheiro' },
          { id: 'history', label: '📋 Histórico' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : ''}`}
            style={activeTab !== tab.id ? { background: '#1e2d4a', color: '#8899bb' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'import' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-title">Importar Excel / CSV</div>

            <form onSubmit={handleImport}>
              <div className="form-group">
                <label className="form-label">Tipo de Dado</label>
                <select
                  className="form-control"
                  value={target}
                  onChange={e => { setTarget(e.target.value); setResult(null); }}
                >
                  {TARGET_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ficheiro (.xlsx, .xls, .csv)</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="form-control"
                  style={{ padding: '0.4rem' }}
                />
              </div>

              {error && <div className="alert alert-danger">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !file}
                style={{ width: '100%' }}
              >
                {loading ? '⏳ A importar...' : '📤 Importar Dados'}
              </button>
            </form>

            {result && (
              <div style={{ marginTop: '1rem' }}>
                <div className="alert" style={{
                  background: result.failed === 0 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${result.failed === 0 ? '#22c55e' : '#f59e0b'}`,
                  borderRadius: '6px', padding: '1rem',
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: result.failed === 0 ? '#22c55e' : '#f59e0b' }}>
                    ✅ Importação Concluída
                  </div>
                  <div style={{ color: '#e0e6f0', fontSize: '0.9rem' }}>
                    <div>📊 Total de linhas: <strong>{result.total}</strong></div>
                    <div style={{ color: '#22c55e' }}>✅ Importados: <strong>{result.imported}</strong></div>
                    {result.failed > 0 && (
                      <div style={{ color: '#ef4444' }}>❌ Falhados: <strong>{result.failed}</strong></div>
                    )}
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Erros:</div>
                    <div style={{
                      background: '#0a0f1e', borderRadius: '4px', padding: '0.5rem',
                      fontSize: '0.8rem', color: '#ef4444', maxHeight: '150px', overflowY: 'auto',
                    }}>
                      {result.errors.map((e, i) => (
                        <div key={i}>Linha {e.row}: {e.error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">📌 Colunas Esperadas</div>
            <p style={{ color: '#8899bb', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Para importar <strong style={{ color: '#00d4ff' }}>{TARGET_OPTIONS.find(t => t.value === target)?.label}</strong>,
              o ficheiro Excel/CSV deve conter as seguintes colunas (a primeira linha deve ser o cabeçalho):
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {COLUMN_HINTS[target].map(col => (
                <span key={col} style={{
                  background: '#1e2d4a', color: '#00d4ff', padding: '0.2rem 0.6rem',
                  borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem',
                }}>
                  {col}
                </span>
              ))}
            </div>
            <div style={{ marginTop: '1rem', color: '#8899bb', fontSize: '0.8rem' }}>
              <p>💡 <strong>Dicas:</strong></p>
              <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.8' }}>
                <li>Os nomes das colunas são insensíveis a maiúsculas/minúsculas.</li>
                <li>Também são aceites variantes em português (ex: <em>nome</em>, <em>matricula</em>).</li>
                <li>Registos duplicados são ignorados automaticamente.</li>
                <li>Tamanho máximo do ficheiro: 10 MB.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="card-title" style={{ margin: 0 }}>Histórico de Importações</div>
            <button className="btn btn-primary" onClick={fetchLogs} disabled={logsLoading}>
              {logsLoading ? '⏳' : '🔄 Atualizar'}
            </button>
          </div>
          {logsLoading ? (
            <div style={{ color: '#8899bb' }}>A carregar...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: '#8899bb' }}>Sem importações registadas.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#1e2d4a' }}>
                    {['Ficheiro', 'Tabela', 'Total', 'Importados', 'Falhados', 'Estado', 'Utilizador', 'Data'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.8rem', color: '#8899bb', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #1e2d4a' }}>
                      <td style={{ padding: '0.5rem 0.8rem', color: '#e0e6f0' }}>{log.filename}</td>
                      <td style={{ padding: '0.5rem 0.8rem', color: '#8899bb' }}>{log.target_table}</td>
                      <td style={{ padding: '0.5rem 0.8rem', color: '#8899bb' }}>{log.records_total}</td>
                      <td style={{ padding: '0.5rem 0.8rem', color: '#22c55e' }}>{log.records_imported}</td>
                      <td style={{ padding: '0.5rem 0.8rem', color: '#ef4444' }}>{log.records_failed}</td>
                      <td style={{ padding: '0.5rem 0.8rem' }}>
                        <span style={{ color: statusColor(log.status), fontWeight: 600 }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.8rem', color: '#8899bb' }}>{log.imported_by_username || '—'}</td>
                      <td style={{ padding: '0.5rem 0.8rem', color: '#8899bb', fontSize: '0.8rem' }}>
                        {new Date(log.created_at).toLocaleString('pt-PT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportManager;
