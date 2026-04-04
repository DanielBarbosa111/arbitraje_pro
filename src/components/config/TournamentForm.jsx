// =====================================================
// Arbitraje Pro — Formulario crear torneo
// =====================================================

import { useState } from 'react';

export default function TournamentForm({ onSubmit, theme, onToggleTheme }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName('');
  }

  return (
    <div className="form-box" style={{ position: 'relative' }}>
      {/* Botón tema — esquina superior izquierda del contenedor */}
      {onToggleTheme && (
        <button
          type="button"
          className="theme-corner-btn"
          onClick={onToggleTheme}
          title="Cambiar tema"
        >
          {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
      )}
      <h3>➕ Crear Nuevo Torneo</h3>
      <form onSubmit={handleSubmit} className="form-group">
        <input
          type="text"
          placeholder="Nombre del torneo (ej: Copa Interfacultades 2025)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="btn-center">
          <button type="submit" className="btn btn-primary">✔ Crear Torneo</button>
        </div>
      </form>
    </div>
  );
}