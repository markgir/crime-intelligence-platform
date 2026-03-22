import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [backupName, setBackupName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/backups');
      setBackups(res.data.backups);
    } catch (err) {
      setError('Erro ao carregar backups.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/backups/statistics/overview');
      setStats(res.data);
    } catch (err) { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchBackups();
    fetchStats();
  }, [fetchBackups, fetchStats]);

  const createBackup = async () => {
    setCreating(true);
    setError(null);
    setSuccess('');
    try {
      const name = backupName.trim() || `manual_backup_${new Date().toISOString().slice(0, 10)}`;
      await api.post('/backups/manual', { backup_name: name });
      setSuccess('Backup criado com sucesso!');
      setBackupName('');
      fetchBackups();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar backup.');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (id) => {
    if (!window.confirm('Tem a certeza que quer restaurar este backup? Esta ação irá substituir os dados actuais.')) return;
    setError(null);
    setSuccess('');
    try {
      await api.post(`/backups/restore/${id}`);
      setSuccess('Base de dados restaurada com sucesso!');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao restaurar backup.');
    }
  };

  const deleteBackup = async (id) => {
    if (!window.confirm('Tem a certeza que quer eliminar este backup?')) return;
    setError(null);
    setSuccess('');
    try {
      await api.delete(`/backups/${id}`);
      setSuccess('Backup eliminado.');
      fetchBackups();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao eliminar backup.');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const statusBadge = (status) => {
    if (status === 'success') return <span className="badge badge-success">✅ Sucesso</span>;
    if (status === 'failed') return <span className="badge badge-danger">❌ Falhou</span>;
    return <span className="badge badge-warning">⏳ Em curso</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">💾 Gestão de Backups</h1>
      </div>

      {stats && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-label">Total Backups</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">✅ Com Sucesso</div>
            <div className="stat-value" style={{ color: '#22c55e' }}>{stats.success}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">❌ Com Falha</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{stats.failed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Tamanho Total</div>
            <div className="stat-value" style={{ fontSize: '1.2rem' }}>{formatBytes(stats.total_size_bytes)}</div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">Criar Backup Manual</div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="form-control"
            style={{ maxWidth: '320px' }}
            placeholder="Nome do backup (opcional)"
            value={backupName}
            onChange={e => setBackupName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={createBackup} disabled={creating}>
            {creating ? '⏳ A criar...' : '💾 Criar Backup'}
          </button>
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#8899bb' }}>
          ⏰ Backups automáticos: Horário • Diário (02:00) • Semanal (Dom. 03:00) • Mensal (1º dia 04:00)
        </p>
      </div>

      <div className="card">
        <div className="card-title">Histórico de Backups</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Nome</th><th>Tipo</th><th>Estado</th><th>Tamanho</th><th>Data</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#8899bb' }}>A carregar...</td></tr>
              ) : backups.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#8899bb' }}>Sem backups registados.</td></tr>
              ) : backups.map(backup => (
                <tr key={backup.id}>
                  <td>{backup.id}</td>
                  <td>{backup.backup_name}</td>
                  <td>
                    <span className={`badge ${backup.backup_type === 'manual' ? 'badge-info' : 'badge-warning'}`}>
                      {backup.backup_type === 'manual' ? '🖐 Manual' : '⏰ Automático'}
                    </span>
                  </td>
                  <td>{statusBadge(backup.status)}</td>
                  <td>{formatBytes(backup.file_size)}</td>
                  <td>{new Date(backup.backup_date).toLocaleString('pt')}</td>
                  <td>
                    {backup.status === 'success' && (
                      <button className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }} onClick={() => restoreBackup(backup.id)}>
                        ♻️ Restaurar
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteBackup(backup.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;