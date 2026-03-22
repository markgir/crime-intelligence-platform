import React, { useState } from 'react';
import api from '../../services/api';

const PersonForm = ({ person, onSave, onCancel }) => {
  const [form, setForm] = useState({
    first_name: person?.first_name || '',
    last_name: person?.last_name || '',
    date_of_birth: person?.date_of_birth ? person.date_of_birth.slice(0, 10) : '',
    id_number: person?.id_number || '',
    nationality: person?.nationality || '',
    notes: person?.notes || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (person?.id) {
        await api.put(`/people/${person.id}`, form);
      } else {
        await api.post('/people', form);
      }
      if (onSave) onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao guardar pessoa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label>Primeiro Nome *</label>
          <input name="first_name" className="form-control" value={form.first_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Apelido *</label>
          <input name="last_name" className="form-control" value={form.last_name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Data de Nascimento</label>
          <input name="date_of_birth" type="date" className="form-control" value={form.date_of_birth} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Nº BI/CC</label>
          <input name="id_number" className="form-control" value={form.id_number} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Nacionalidade</label>
          <input name="nationality" className="form-control" value={form.nationality} onChange={handleChange} />
        </div>
      </div>
      <div className="form-group">
        <label>Notas</label>
        <textarea name="notes" className="form-control" rows={3} value={form.notes} onChange={handleChange} />
      </div>
      <div className="modal-footer">
        {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'A guardar...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
};

export default PersonForm;
