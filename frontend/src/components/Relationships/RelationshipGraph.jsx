import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const RelationshipGraph = () => {
  const [relationships, setRelationships] = useState([]);
  const [drugNetwork, setDrugNetwork] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('relationships');
  const [showModal, setShowModal] = useState(false);
  const [relType, setRelType] = useState('person-to-person');
  const [form, setForm] = useState({ person_id_1: '', person_id_2: '', vehicle_id: '', crime_id: '', relationship_type: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [showDrugModal, setShowDrugModal] = useState(false);
  const [drugForm, setDrugForm] = useState({ consumer_id: '', seller_id: '', distributor_id: '', substance_type: '', quantity: '', transaction_date: '', notes: '' });

  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/relationships');
      setRelationships(res.data.relationships);
    } catch (err) {
      setError('Erro ao carregar relacionamentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrugNetwork = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/relationships/drug-network/all');
      setDrugNetwork(res.data.drug_network);
    } catch (err) {
      setError('Erro ao carregar rede de drogas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'relationships') fetchRelationships();
    else fetchDrugNetwork();
  }, [activeTab, fetchRelationships, fetchDrugNetwork]);

  const handleFormChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setFormError(''); };
  const handleDrugFormChange = (e) => { setDrugForm({ ...drugForm, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post(`/relationships/${relType}`, form);
      setShowModal(false);
      fetchRelationships();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao criar relacionamento.');
    }
  };

  const handleDrugSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/relationships/drug-network', drugForm);
      setShowDrugModal(false);
      fetchDrugNetwork();
    } catch (err) {
      setError('Erro ao criar entrada na rede de drogas.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este relacionamento?')) return;
    try {
      await api.delete(`/relationships/${id}`);
      fetchRelationships();
    } catch (err) {
      setError('Erro ao eliminar relacionamento.');
    }
  };

  const openAddRelModal = () => {
    setForm({ person_id_1: '', person_id_2: '', vehicle_id: '', crime_id: '', relationship_type: '', notes: '' });
    setRelType('person-to-person');
    setFormError('');
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🔗 Relacionamentos</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={openAddRelModal}>+ Novo Relacionamento</button>
          <button className="btn btn-secondary" onClick={() => setShowDrugModal(true)}>💊 Rede de Drogas</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'relationships' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('relationships')}>Relacionamentos</button>
        <button className={`btn ${activeTab === 'drugs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('drugs')}>💊 Rede de Drogas</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {activeTab === 'relationships' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Tipo de Relação</th><th>Pessoa 1</th><th>Pessoa 2</th><th>Veículo</th><th>Crime</th><th>Notas</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', color: '#8899bb' }}>A carregar...</td></tr>
                ) : relationships.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', color: '#8899bb' }}>Sem relacionamentos registados.</td></tr>
                ) : relationships.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td><span className="badge badge-info">{r.relationship_type}</span></td>
                    <td>{r.person1_first_name ? `${r.person1_first_name} ${r.person1_last_name}` : '-'}</td>
                    <td>{r.person2_first_name ? `${r.person2_first_name} ${r.person2_last_name}` : '-'}</td>
                    <td>{r.registration_plate ? `${r.brand} ${r.model} (${r.registration_plate})` : '-'}</td>
                    <td>{r.crime_location || '-'}</td>
                    <td>{r.notes || '-'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'drugs' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Consumidor</th><th>Vendedor</th><th>Distribuidor</th><th>Substância</th><th>Quantidade</th><th>Data Transação</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: '#8899bb' }}>A carregar...</td></tr>
                ) : drugNetwork.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: '#8899bb' }}>Sem entradas na rede de drogas.</td></tr>
                ) : drugNetwork.map(d => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.consumer_first_name ? `${d.consumer_first_name} ${d.consumer_last_name}` : '-'}</td>
                    <td>{d.seller_first_name ? `${d.seller_first_name} ${d.seller_last_name}` : '-'}</td>
                    <td>{d.distributor_first_name ? `${d.distributor_first_name} ${d.distributor_last_name}` : '-'}</td>
                    <td>{d.substance_type || '-'}</td>
                    <td>{d.quantity || '-'}</td>
                    <td>{d.transaction_date ? new Date(d.transaction_date).toLocaleDateString('pt') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Relacionamento</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tipo de Ligação</label>
                <select className="form-control" value={relType} onChange={e => setRelType(e.target.value)}>
                  <option value="person-to-person">Pessoa ↔ Pessoa</option>
                  <option value="person-to-vehicle">Pessoa ↔ Veículo</option>
                  <option value="person-to-crime">Pessoa ↔ Crime</option>
                  <option value="vehicle-to-crime">Veículo ↔ Crime</option>
                </select>
              </div>
              <div className="form-group">
                <label>ID Pessoa 1 {relType !== 'vehicle-to-crime' ? '*' : ''}</label>
                <input name="person_id_1" type="number" className="form-control" value={form.person_id_1} onChange={handleFormChange} required={relType !== 'vehicle-to-crime'} />
              </div>
              {relType === 'person-to-person' && (
                <div className="form-group">
                  <label>ID Pessoa 2 *</label>
                  <input name="person_id_2" type="number" className="form-control" value={form.person_id_2} onChange={handleFormChange} required />
                </div>
              )}
              {(relType === 'person-to-vehicle' || relType === 'vehicle-to-crime') && (
                <div className="form-group">
                  <label>ID Veículo *</label>
                  <input name="vehicle_id" type="number" className="form-control" value={form.vehicle_id} onChange={handleFormChange} required />
                </div>
              )}
              {(relType === 'person-to-crime' || relType === 'vehicle-to-crime') && (
                <div className="form-group">
                  <label>ID Crime *</label>
                  <input name="crime_id" type="number" className="form-control" value={form.crime_id} onChange={handleFormChange} required />
                </div>
              )}
              <div className="form-group">
                <label>Tipo de Relação *</label>
                <input name="relationship_type" className="form-control" placeholder="ex: amigo, condutor, suspeito..." value={form.relationship_type} onChange={handleFormChange} required />
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

      {showDrugModal && (
        <div className="modal-overlay" onClick={() => setShowDrugModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">💊 Nova Entrada na Rede de Drogas</h2>
              <button className="modal-close" onClick={() => setShowDrugModal(false)}>×</button>
            </div>
            <form onSubmit={handleDrugSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>ID Consumidor</label>
                  <input name="consumer_id" type="number" className="form-control" value={drugForm.consumer_id} onChange={handleDrugFormChange} />
                </div>
                <div className="form-group">
                  <label>ID Vendedor</label>
                  <input name="seller_id" type="number" className="form-control" value={drugForm.seller_id} onChange={handleDrugFormChange} />
                </div>
                <div className="form-group">
                  <label>ID Distribuidor</label>
                  <input name="distributor_id" type="number" className="form-control" value={drugForm.distributor_id} onChange={handleDrugFormChange} />
                </div>
                <div className="form-group">
                  <label>Substância</label>
                  <input name="substance_type" className="form-control" value={drugForm.substance_type} onChange={handleDrugFormChange} />
                </div>
                <div className="form-group">
                  <label>Quantidade</label>
                  <input name="quantity" type="number" step="any" className="form-control" value={drugForm.quantity} onChange={handleDrugFormChange} />
                </div>
                <div className="form-group">
                  <label>Data da Transação</label>
                  <input name="transaction_date" type="datetime-local" className="form-control" value={drugForm.transaction_date} onChange={handleDrugFormChange} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notas</label>
                  <textarea name="notes" className="form-control" rows={3} value={drugForm.notes} onChange={handleDrugFormChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDrugModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipGraph;
