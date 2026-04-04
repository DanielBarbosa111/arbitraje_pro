// =====================================================
// Arbitraje Pro — Formulario de Login
// =====================================================

import { useState } from 'react';
import { api } from '../../api/client';

export default function LoginForm({ onLogin, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api('/auth/login', { username: username.trim(), password });
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>🔐 Iniciar Sesión</h3>

        <form onSubmit={handleSubmit} className="form-group" style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && (
            <p style={{
              color: 'var(--danger)',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.95em'
            }}>
              ⚠️ {error}
            </p>
          )}

          <div className="btn-center">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Entrando...' : '✅ Entrar'}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={onClose}
            >
              ✕ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}