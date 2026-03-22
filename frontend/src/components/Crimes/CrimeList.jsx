import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_LABELS = { open: { label: 'Aberto', cls: 'badge-danger' }, investigating: { label: 'Em Investigação', cls: 'badge-warning' }, closed: { label: 'Encerrado', cls: 'badge-success' } };

const CrimeList = () => {
  const [crimes, setCrimes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCrime, setEditCrime] = useState(null);
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [form, setForm] = useState({ crime_type_id: '', location: '', latitude: '', longitude: '', crime_date: '', description: '', status: 'open' });
  const [formError, setFormError] = useState('');
  const LIMIT = 20;

  const fetchCrimes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT, search };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/crimes', { params });
      setCrimes(res.data.crimes);
      setTotal(res.data.total);
    } catch (err) {
      setError('Erro ao carregar crimes.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchCrimeTypes = useCallback(async () => {
    try {
      const res = await api.get('/crimes/types/all');
      setCrimeTypes(res.data.types);
    } catch (err) { /* ignore */ }
  }, []);

  useEffect(() => { fetchCrimes(); }, [fetchCrimes]);
  useEffect(() => { fetchCrimeTypes(); }, [fetchCrimeTypes]);

  const openCreate = () => {
    setEditCrime(null);
    setForm({ crime_type_id: '', location: '', latitude: '', longitude: '', crime_date: '', description: '', status: 'open' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCrime(c);
    setForm({
      crime_type_id: c.crime_type_id || '',
      location: c.location || '',
      latitude: c.latitude || '',
      longitude: c.longitude || '',
      crime_date: c.crime_date ? c.crime_date.slice(0, 16) : '',
      description: c.description || '',
      status: c.status || 'open',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editCrime) {
        await api.put(`/crimes/${editCrime.id}`, form);
      } else {
        await api.post('/crimes', form);
      }
      setShowModal(false);
      fetchCrimes();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao guardar crime.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem a certeza que quer eliminar este crime?')) return;
    try {
      await api.delete(`/crimes/${id}`);
      fetchCrimes();
    } catch (err) {
      setError('Erro ao eliminar crime.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🚨 Crimes</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo Crime</button>
      </div>
      <div className="search-bar">
        <input
          className="form-control search-input"
          placeholder="Pesquisar por local, descrição..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Todos os estados</option>
          <option value="open">Aberto</option>
          <option value="investigating">Em Investigação</option>
          <option value="closed">Encerrado</option>
        </select>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Tipo</th><th>Local</th><th>Data</th><th>Descrição</th><th>Estado</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#8899bb' }}>A carregar...</td></tr>
              ) : crimes.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#8899bb' }}>Sem resultados.</td></tr>
              ) : crimes.map(c => {
                const s = STATUS_LABELS[c.status] || { label: c.status, cls: 'badge-info' };
                return (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.crime_type_name || '-'}</td>
                    <td>{c.location}</td>
                    <td>{new Date(c.crime_date).toLocaleDateString('pt')}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</td>
                    <td><span className={`badge ${s.cls}`}>{s.label}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }} onClick={() => openEdit(c)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            <span>{page} / {totalPages} ({total} total)</span>
            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editCrime ? 'Editar Crime' : 'Novo Crime'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Tipo de Crime</label>
                  <select name="crime_type_id" className="form-control" value={form.crime_type_id} onChange={handleFormChange}>
                    <option value="">Sem tipo</option>
                    {crimeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select name="status" className="form-control" value={form.status} onChange={handleFormChange}>
                    <option value="open">Aberto</option>
                    <option value="investigating">Em Investigação</option>
                    <option value="closed">Encerrado</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Local *</label>
                  <input name="location" className="form-control" value={form.location} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Latitude</label>
                  <input name="latitude" type="number" step="any" className="form-control" value={form.latitude} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input name="longitude" type="number" step="any" className="form-control" value={form.longitude} onChange={handleFormChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Data/Hora do Crime *</label>
                  <input name="crime_date" type="datetime-local" className="form-control" value={form.crime_date} onChange={handleFormChange} required />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Descrição *</label>
                  <textarea name="description" className="form-control" rows={4} value={form.description} onChange={handleFormChange} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrimeList;
