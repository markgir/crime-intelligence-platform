import React, { useState } from 'react';
import api from '../../services/api';

const REPORT_TYPES = [
  {
    id: 'crimes',
    label: '🚨 Relatório de Crimes',
    description: 'Exporta a lista completa de crimes com filtros por estado, tipo e período.',
    endpoint: '/reports/crimes',
    fields: [
      { name: 'status', label: 'Estado', type: 'select', options: [{ v: '', l: 'Todos' }, { v: 'open', l: 'Aberto' }, { v: 'investigating', l: 'Em Investigação' }, { v: 'closed', l: 'Encerrado' }] },
      { name: 'start_date', label: 'Data Início', type: 'date' },
      { name: 'end_date', label: 'Data Fim', type: 'date' },
    ],
  },
  {
    id: 'people',
    label: '👥 Relatório de Pessoas',
    description: 'Exporta o registo de pessoas com contagem de crimes como suspeito e vítima.',
    endpoint: '/reports/people',
    fields: [],
  },
];

const ReportGenerator = () => {
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post(selectedReport.endpoint, formData, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_${selectedReport.id}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccess('Relatório gerado e descarregado com sucesso!');
    } catch (err) {
      setError('Erro ao gerar relatório PDF. Verifique os filtros e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📄 Relatórios PDF</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        {/* Report type selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {REPORT_TYPES.map(report => (
            <div
              key={report.id}
              onClick={() => { setSelectedReport(report); setFormData({}); setError(''); setSuccess(''); }}
              style={{
                background: selectedReport.id === report.id ? 'rgba(0,212,255,0.1)' : '#111827',
                border: `1px solid ${selectedReport.id === report.id ? '#00d4ff' : '#1e2d4a'}`,
                borderRadius: '8px', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ fontWeight: 600, color: selectedReport.id === report.id ? '#00d4ff' : '#e0e6f0', marginBottom: '0.3rem' }}>
                {report.label}
              </div>
              <div style={{ color: '#8899bb', fontSize: '0.8rem' }}>{report.description}</div>
            </div>
          ))}
        </div>

        {/* Report config & generate */}
        <div className="card">
          <div className="card-title">{selectedReport.label}</div>
          <p style={{ color: '#8899bb', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {selectedReport.description}
          </p>

          {selectedReport.fields.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ color: '#e0e6f0', fontWeight: 600, marginBottom: '0.8rem', fontSize: '0.9rem' }}>
                Filtros (opcionais)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {selectedReport.fields.map(field => (
                  <div key={field.name} className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        className="form-control"
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                      >
                        {field.options.map(opt => (
                          <option key={opt.v} value={opt.v}>{opt.l}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        className="form-control"
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger">{error}</div>}
          {success && (
            <div className="alert" style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e',
              borderRadius: '6px', padding: '0.8rem 1rem', color: '#22c55e', marginBottom: '1rem',
            }}>
              ✅ {success}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading}
            style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}
          >
            {loading ? (
              <span>⏳ A gerar PDF...</span>
            ) : (
              <span>📄 Gerar e Descarregar PDF</span>
            )}
          </button>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#0a0f1e', borderRadius: '6px' }}>
            <div style={{ color: '#8899bb', fontSize: '0.8rem' }}>
              <strong style={{ color: '#00d4ff' }}>ℹ️ Informação:</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', lineHeight: '1.8' }}>
                <li>O relatório é gerado em formato PDF (A4).</li>
                <li>Máximo de 500 registos por relatório.</li>
                <li>Os filtros são opcionais — deixe em branco para incluir todos os registos.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
