import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const PeopleList = () => {
  const [people, setPeople] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', date_of_birth: '', id_number: '', nationality: '', notes: '' });
  const [formError, setFormError] = useState('');
  const LIMIT = 20;

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/people', { params: { page, limit: LIMIT, search } });
      setPeople(res.data.people);
      setTotal(res.data.total);
    } catch (err) {
      setError('Erro ao carregar pessoas.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  const openCreate = () => {
    setEditPerson(null);
    setForm({ first_name: '', last_name: '', date_of_birth: '', id_number: '', nationality: '', notes: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (person) => {
    setEditPerson(person);
    setForm({
      first_name: person.first_name || '',
      last_name: person.last_name || '',
      date_of_birth: person.date_of_birth ? person.date_of_birth.slice(0, 10) : '',
      id_number: person.id_number || '',
      nationality: person.nationality || '',
      notes: person.notes || '',
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
      if (editPerson) {
        await api.put(`/people/${editPerson.id}`, form);
      } else {
        await api.post('/people', form);
      }
      setShowModal(false);
      fetchPeople();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao guardar pessoa.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem a certeza que quer eliminar esta pessoa?')) return;
    try {
      await api.delete(`/people/${id}`);
      fetchPeople();
    } catch (err) {
      setError('Erro ao eliminar pessoa.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Pessoas</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Nova Pessoa</button>
      </div>
      <div className="search-bar">
        <input
          className="form-control search-input"
          placeholder="Pesquisar por nome, BI, nacionalidade..."
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
                <th>ID</th><th>Nome</th><th>Data Nasc.</th><th>Nº BI/CC</th><th>Nacionalidade</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8899bb' }}>A carregar...</td></tr>
              ) : people.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#8899bb' }}>Sem resultados.</td></tr>
              ) : people.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.first_name} {p.last_name}</td>
                  <td>{p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('pt') : '-'}</td>
                  <td>{p.id_number || '-'}</td>
                  <td>{p.nationality || '-'}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }} onClick={() => openEdit(p)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
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
              <h2 className="modal-title">{editPerson ? 'Editar Pessoa' : 'Nova Pessoa'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Primeiro Nome *</label>
                  <input name="first_name" className="form-control" value={form.first_name} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Apelido *</label>
                  <input name="last_name" className="form-control" value={form.last_name} onChange={handleFormChange} required />
                </div>
                <div className="form-group">
                  <label>Data de Nascimento</label>
                  <input name="date_of_birth" type="date" className="form-control" value={form.date_of_birth} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Nº BI/CC</label>
                  <input name="id_number" className="form-control" value={form.id_number} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label>Nacionalidade</label>
                  <input name="nationality" className="form-control" value={form.nationality} onChange={handleFormChange} />
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

export default PeopleList;
