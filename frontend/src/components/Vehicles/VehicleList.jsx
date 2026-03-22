import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [form, setForm] = useState({ registration_plate: '', brand: '', model: '', color: '', vehicle_type: '', owner_id: '', notes: '' });
  const [formError, setFormError] = useState('');
  const LIMIT = 20;

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/vehicles', { params: { page, limit: LIMIT, search } });
      setVehicles(res.data.vehicles);
      setTotal(res.data.total);
    } catch (err) {
      setError('Erro ao carregar veículos.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const openCreate = () => {
    setEditVehicle(null);
    setForm({ registration_plate: '', brand: '', model: '', color: '', vehicle_type: '', owner_id: '', notes: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditVehicle(v);
    setForm({
      registration_plate: v.registration_plate || '',
      brand: v.brand || '',
      model: v.model || '',
      color: v.color || '',
      vehicle_type: v.vehicle_type || '',
      owner_id: v.owner_id || '',
      notes: v.notes || '',
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
      if (editVehicle) {
        await api.put(`/vehicles/${editVehicle.id}`, form);
      } else {
        await api.post('/vehicles', form);
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao guardar veículo.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem a certeza que quer eliminar este veículo?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      setError('Erro ao eliminar veículo.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🚗 Veículos</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Novo Veículo</button>
      </div>
      <div className="search-bar">
        <input
          className="form-control search-input"
          placeholder="Pesquisar por matrícula, marca, modelo..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Matrícula</th><th>Marca</th><th>Modelo</th><th>Cor</th><th>Tipo</th><th>Proprietário</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#8899bb' }}>A carregar...</td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#8899bb' }}>Sem resultados.</td></tr>
              ) : vehicles.map(v => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td><strong style={{ color: '#00d4ff' }}>{v.registration_plate}</strong></td>
                  <td>{v.brand}</td>
                  <td>{v.model}</td>
                  <td>{v.color || '-'}</td>
                  <td>{v.vehicle_type || '-'}</td>
                  <td>{v.first_name ? `${v.first_name} ${v.last_name}` : '-'}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }} onClick={() => openEdit(v)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
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
              <h2 className="modal-title">{editVehicle ? 'Editar Veículo' : 'Novo Veículo'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Matrícula *</label>
                  <input name="registration_plate" className="form-control" value={form.registration_plate} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Marca *</label>
                  <input name="brand" className="form-control" value={form.brand} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Modelo *</label>
                  <input name="model" className="form-control" value={form.model} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Cor</label>
                  <input name="color" className="form-control" value={form.color} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Tipo de Veículo</label>
                  <select name="vehicle_type" className="form-control" value={form.vehicle_type} onChange={handleFormChange}>
                    <option value="">Selecionar...</option>
                    <option>Ligeiro</option><option>Pesado</option><option>Motociclo</option>
                    <option>Furgão</option><option>SUV</option><option>Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ID do Proprietário</label>
                  <input name="owner_id" type="number" className="form-control" value={form.owner_id} onChange={handleFormChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <textarea name="notes" className="form-control" rows={3} value={form.notes} onChange={handleFormChange} />
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

export default VehicleList;
