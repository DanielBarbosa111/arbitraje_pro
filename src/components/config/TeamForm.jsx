// =====================================================
// Arbitraje Pro — Formulario agregar equipo
// =====================================================

import { useState } from 'react';

export default function TeamForm({ onSubmit, subtorneoType }) {
  const [name, setName] = useState('');
  const [players, setPlayers] = useState(['', '', '', '', '']);

  const isTenis = subtorneoType === 'tenis';

  function handlePlayerChange(index, value) {
    const updated = [...players];
    updated[index] = value;
    setPlayers(updated);
  }

  function addPlayerInput() {
    setPlayers([...players, '']);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    const filtered = players.map(p => p.trim()).filter(p => p);
    const min = isTenis ? 1 : 5;

    if (filtered.length < min) return;

    onSubmit(name.trim(), filtered);
    setName('');
    setPlayers(isTenis ? [''] : ['', '', '', '', '']);
  }

  return (
    <div className="form-box">
      <h3>➕ {isTenis ? 'Agregar Jugador' : 'Agregar Equipo'}</h3>
      <form onSubmit={handleSubmit} className="form-group">
        <input
          type="text"
          placeholder={isTenis ? 'Nombre del jugador' : 'Nombre del equipo'}
          value={name}
          onChange={e => setName(e.target.value)}
        />

        {!isTenis && (
          <>
            {players.map((p, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Jugador ${i + 1}`}
                value={p}
                onChange={e => handlePlayerChange(i, e.target.value)}
              />
            ))}
            <div className="btn-center">
              <button type="button" className="btn btn-warning" onClick={addPlayerInput}>
                + Agregar Jugador
              </button>
            </div>
          </>
        )}

        <div className="btn-center">
          <button type="submit" className="btn btn-primary">
            ✔ {isTenis ? 'Guardar Jugador' : 'Guardar Equipo'}
          </button>
        </div>
      </form>
    </div>
  );
}