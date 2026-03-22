import React, { useState } from 'react';
import api from '../../services/api';

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Por favor preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', form);
      const { token } = response.data;
      onLogin(token);
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🔍</div>
        <h1 className="login-title">Crime Intelligence Platform</h1>
        <p className="login-subtitle">Plataforma de Inteligência Criminal</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Utilizador</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              placeholder="Nome de utilizador"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Password"
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
