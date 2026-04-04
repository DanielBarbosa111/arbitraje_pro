// =====================================================
// Arbitraje Pro — Lista de equipos registrados
// =====================================================

import { useState } from 'react';

export default function TeamsList({ teams, onRemove, onRenameTeam, onRenamePlayer, onRemovePlayer, subtorneoType }) {
  const isTenis = subtorneoType === 'tenis';

  const [editingTeam, setEditingTeam] = useState(null);
  const [editingTeamVal, setEditingTeamVal] = useState('');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingPlayerVal, setEditingPlayerVal] = useState('');

  function startEditTeam(team) {
    setEditingTeam(team.id);
    setEditingTeamVal(team.name);
    setEditingPlayer(null);
  }

  function startEditPlayer(player) {
    setEditingPlayer(player.id);
    setEditingPlayerVal(player.name);
    setEditingTeam(null);
  }

  function cancelEdits() {
    setEditingTeam(null);
    setEditingPlayer(null);
  }

  async function commitTeamRename(teamId) {
    const val = editingTeamVal.trim();
    if (!val) return;
    await onRenameTeam(teamId, val);
    setEditingTeam(null);
  }

  async function commitPlayerRename(playerId) {
    const val = editingPlayerVal.trim();
    if (!val) return;
    await onRenamePlayer(playerId, val);
    setEditingPlayer(null);
  }

  function handleTeamKeyDown(e, teamId) {
    if (e.key === 'Enter') commitTeamRename(teamId);
    if (e.key === 'Escape') cancelEdits();
  }

  function handlePlayerKeyDown(e, playerId) {
    if (e.key === 'Enter') commitPlayerRename(playerId);
    if (e.key === 'Escape') cancelEdits();
  }

  if (!teams.length) {
    return (
      <div className="empty-state" style={{ padding: '30px' }}>
        <h3>{isTenis ? '🏓 Sin jugadores' : '⚽ Sin equipos'}</h3>
        <p>{isTenis ? 'Agrega jugadores a esta jornada' : 'Agrega equipos a esta jornada'}</p>
      </div>
    );
  }

  const canEdit = !!(onRenameTeam || onRenamePlayer || onRemovePlayer);

  /* ── Estilos de botones ── */
  const baseBtn = {
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    lineHeight: 1,
  };

  // Botones del header del equipo (más grandes)
  const teamEditBtn = {
    ...baseBtn,
    width: '30px', height: '30px',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'rgba(0, 210, 150, 0.12)',
    color: 'var(--accent, #00d296)',
    border: '1.5px solid rgba(0, 210, 150, 0.4)',
  };

  const teamDeleteBtn = {
    ...baseBtn,
    width: '30px', height: '30px',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'rgba(255, 71, 87, 0.12)',
    color: '#ff4757',
    border: '1.5px solid rgba(255, 71, 87, 0.4)',
  };

  const teamSaveBtn = {
    ...baseBtn,
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    background: 'rgba(0, 210, 150, 0.15)',
    color: 'var(--accent, #00d296)',
    border: '1.5px solid rgba(0, 210, 150, 0.5)',
  };

  const teamCancelBtn = {
    ...baseBtn,
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    background: 'rgba(255, 71, 87, 0.15)',
    color: '#ff4757',
    border: '1.5px solid rgba(255, 71, 87, 0.5)',
  };

  // Botones de fila de jugador (más pequeños)
  const playerEditBtn = {
    ...baseBtn,
    width: '22px', height: '22px',
    borderRadius: '6px',
    fontSize: '11px',
    background: 'rgba(0, 210, 150, 0.10)',
    color: 'var(--accent, #00d296)',
    border: '1.5px solid rgba(0, 210, 150, 0.3)',
  };

  const playerDeleteBtn = {
    ...baseBtn,
    width: '22px', height: '22px',
    borderRadius: '6px',
    fontSize: '11px',
    background: 'rgba(255, 71, 87, 0.10)',
    color: '#ff4757',
    border: '1.5px solid rgba(255, 71, 87, 0.3)',
  };

  const playerSaveBtn = {
    ...baseBtn,
    padding: '2px 8px',
    borderRadius: '5px',
    fontSize: '12px',
    background: 'rgba(0, 210, 150, 0.15)',
    color: 'var(--accent, #00d296)',
    border: '1.5px solid rgba(0, 210, 150, 0.4)',
  };

  const playerCancelBtn = {
    ...baseBtn,
    padding: '2px 8px',
    borderRadius: '5px',
    fontSize: '12px',
    background: 'rgba(255, 71, 87, 0.15)',
    color: '#ff4757',
    border: '1.5px solid rgba(255, 71, 87, 0.4)',
  };

  return (
    <div className="teams-grid">
      {teams.map((team, index) => (
        <div key={team.id} className="team-card" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="team-card-top"></div>

          <div className="team-card-header">
            <div className="team-card-icon">
              {isTenis ? '🏓' : '⚽'}
            </div>

            {/* Nombre equipo — editable */}
            {editingTeam === team.id ? (
              <div style={{ display: 'flex', gap: '6px', flex: 1, alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ flex: 1, padding: '4px 8px', fontSize: '0.9em' }}
                  value={editingTeamVal}
                  onChange={e => setEditingTeamVal(e.target.value)}
                  onKeyDown={e => handleTeamKeyDown(e, team.id)}
                  autoFocus
                />
                <button style={teamSaveBtn} onClick={() => commitTeamRename(team.id)} title="Guardar (Enter)">✓</button>
                <button style={teamCancelBtn} onClick={cancelEdits} title="Cancelar (Esc)">✕</button>
              </div>
            ) : (
              <>
                <h3 className="team-card-name" style={{ flex: 1 }}>
                  {team.name}
                </h3>

                {/* ── Botones agrupados: ✏️ y 🗑️ juntos ── */}
                {canEdit && (
                  <div style={{
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'center',
                    flexShrink: 0,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    padding: '4px 6px',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    {onRenameTeam && (
                      <button
                        style={teamEditBtn}
                        onClick={() => startEditTeam(team)}
                        title="Editar nombre del equipo"
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,210,150,0.25)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,210,150,0.12)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        ✏️
                      </button>
                    )}
                    {onRemove && (
                      <button
                        style={teamDeleteBtn}
                        onClick={() => onRemove(team.id, team.name)}
                        title="Descalificar equipo"
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.25)'; e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.12)'; e.currentTarget.style.transform = 'scale(1) rotate(0)'; }}
                      >
                        🚫
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Lista de jugadores */}
          {!isTenis && team.players && team.players.length > 0 && (
            <>
              <div className="team-card-count">
                {team.players.length} jugadores
              </div>
              <ul className="team-players-list">
                {team.players.map((p, i) => (
                  <li key={p.id} className="team-player-item" style={{ animationDelay: `${i * 0.05}s` }}>
                    <span className="team-player-number">{i + 1}</span>

                    {editingPlayer === p.id ? (
                      <div style={{ display: 'flex', gap: '4px', flex: 1, alignItems: 'center' }}>
                        <input
                          className="form-input"
                          style={{ flex: 1, padding: '2px 6px', fontSize: '0.85em' }}
                          value={editingPlayerVal}
                          onChange={e => setEditingPlayerVal(e.target.value)}
                          onKeyDown={e => handlePlayerKeyDown(e, p.id)}
                          autoFocus
                        />
                        <button style={playerSaveBtn} onClick={() => commitPlayerRename(p.id)} title="Guardar">✓</button>
                        <button style={playerCancelBtn} onClick={cancelEdits} title="Cancelar">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="team-player-name" style={{ flex: 1 }}>
                          {p.name}
                        </span>

                        {/* ── Botones agrupados jugador: ✏️ y 🗑️ juntos ── */}
                        {(onRenamePlayer || onRemovePlayer) && (
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                            flexShrink: 0,
                            background: 'rgba(255,255,255,0.04)',
                            borderRadius: '7px',
                            padding: '3px 4px',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}>
                            {onRenamePlayer && (
                              <button
                                style={playerEditBtn}
                                onClick={() => startEditPlayer(p)}
                                title="Editar nombre"
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,210,150,0.25)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,210,150,0.10)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                ✏️
                              </button>
                            )}
                            {onRemovePlayer && (
                              <button
                                style={playerDeleteBtn}
                                onClick={() => onRemovePlayer(p.id, p.name, team.name)}
                                title="Eliminar jugador"
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.25)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,71,87,0.10)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
}