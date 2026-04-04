// =====================================================
// Arbitraje Pro — Página de Configuración
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import TournamentForm from './TournamentForm';
import TeamForm from './TeamForm';
import TeamsList from './TeamsList';

function statusLabel(status) {
  switch (status) {
    case 'setup':    return 'Estado: Configuración';
    case 'fase1':    return 'Estado: Fase de Grupos';
    case 'fase2':    return 'Estado: En Llaves';
    case 'finished': return 'Estado: Finalizado';
    default:         return status;
  }
}

function statusBadgeClass(status) {
  switch (status) {
    case 'setup':    return 'badge-warning';
    case 'fase1':    return 'badge-info';
    case 'fase2':    return 'badge-warning';
    case 'finished': return 'badge-success';
    default:         return 'badge-info';
  }
}

export default function ConfigPage({ showToast }) {
  const { theme, toggleTheme } = useTheme();
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [subtorneos, setSubtorneos] = useState([]);
  const [activeSubtorneo, setActiveSubtorneo] = useState(null);
  const [editingTournament, setEditingTournament] = useState(null); // { id, name }
  const [jornadas, setJornadas] = useState([]);
  const [activeJornada, setActiveJornada] = useState(null);
  const [teams, setTeams] = useState([]);
  const [showTeamForm, setShowTeamForm] = useState(false);

  async function loadTournaments() {
    try {
      const data = await api('/tournaments/list');
      setTournaments(data);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadSubtorneos(tid) {
    try {
      const data = await api(`/jornadas/subtorneos?tournament_id=${tid}`);
      setSubtorneos(data);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadJornadas(sid) {
    try {
      const data = await api(`/jornadas/list?subtorneo_id=${sid}`);
      setJornadas(data);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadTeams(jid) {
    try {
      const data = await api(`/teams/list?jornada_id=${jid}`);
      setTeams(data);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleCreateTournament(name) {
    try {
      await api('/tournaments/create', { name });
      showToast('✅ Torneo creado con 4 subtorneos y 20 jornadas', 'success');
      await loadTournaments();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleDeleteTournament(tid) {
    if (!confirm('¿Eliminar este torneo? Se perderá todo.')) return;
    try {
      await api('/tournaments/delete', { tournament_id: tid });
      showToast('🗑️ Torneo eliminado', 'danger');
      if (activeTournament === tid) {
        setActiveTournament(null);
        setSubtorneos([]);
        setActiveSubtorneo(null);
        setJornadas([]);
        setActiveJornada(null);
        setTeams([]);
      }
      await loadTournaments();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  // ── Refs para scroll automático ──
  const refTorneos    = useRef(null);
  const refSubtorneos = useRef(null);
  const refJornadas   = useRef(null);
  const refEquipos    = useRef(null);

  function scrollTo(ref) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }
  // Scroll automático cuando cambia activeTournament
  useEffect(() => {
    if (activeTournament) scrollTo(refSubtorneos);
  }, [activeTournament]);

  // Scroll automático cuando cambia activeSubtorneo
  useEffect(() => {
    if (activeSubtorneo) scrollTo(refJornadas);
  }, [activeSubtorneo]);

  // Scroll automático cuando cambia activeJornada
  useEffect(() => {
    if (activeJornada) scrollTo(refEquipos);
  }, [activeJornada]);


  function handleSelectTournament(tid) {
    setActiveTournament(tid);
    setActiveSubtorneo(null);
    setJornadas([]);
    setActiveJornada(null);
    setTeams([]);
    setShowTeamForm(false);
    loadSubtorneos(tid);
  }

  async function handleRenameTournament(tid, newName) {
    if (!newName.trim()) return;
    try {
      await api('/tournaments/rename', { tournament_id: tid, name: newName });
      showToast('✅ Nombre actualizado', 'success');
      setEditingTournament(null);
      loadTournaments();
    } catch (err) { showToast(err.message, 'danger'); }
  }

  async function handleToggleVisible(tid) {
    try {
      const res = await api('/tournaments/toggle-visible', { tournament_id: tid });
      showToast(res.visible ? '👁️ Torneo visible' : '🙈 Torneo oculto', 'info');
      loadTournaments();
    } catch (err) { showToast(err.message, 'danger'); }
  }

  function handleSelectSubtorneo(sid) {
    setActiveSubtorneo(sid);
    setActiveJornada(null);
    setTeams([]);
    setShowTeamForm(false);
    loadJornadas(sid);
  }

  function handleSelectJornada(jid) {
    setActiveJornada(jid);
    setShowTeamForm(false);
    loadTeams(jid);
  }

  async function handleAddTeam(name, players) {
    try {
      await api('/teams/add', { jornada_id: activeJornada, name, players });
      showToast(`✅ "${name}" agregado`, 'success');
      setShowTeamForm(false);
      await loadTeams(activeJornada);
      await loadJornadas(activeSubtorneo);
      await loadSubtorneos(activeTournament);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleRemoveTeam(teamId, teamName) {
    if (!confirm(`¿Descalificar a "${teamName}"? El equipo será retirado del subtorneo.`)) return;
    try {
      await api('/teams/remove', { team_id: teamId });
      showToast(`🚫 "${teamName}" descalificado`, 'danger');
      await loadTeams(activeJornada);
      await loadJornadas(activeSubtorneo);
      await loadSubtorneos(activeTournament);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleRenameTeam(teamId, newName) {
    try {
      await api('/teams/rename', { team_id: teamId, name: newName }, 'PUT');
      showToast(`✏️ Equipo renombrado a "${newName}"`, 'success');
      await loadTeams(activeJornada);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleRenamePlayer(playerId, newName) {
    try {
      await api('/teams/player/rename', { player_id: playerId, name: newName }, 'PUT');
      showToast(`✏️ Jugador renombrado a "${newName}"`, 'success');
      await loadTeams(activeJornada);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleRemovePlayer(playerId, playerName, teamName) {
    if (!confirm(`¿Eliminar a "${playerName}" de "${teamName}"?`)) return;
    try {
      await api('/teams/player/remove', { player_id: playerId }, 'DELETE');
      showToast(`🗑️ "${playerName}" eliminado`, 'danger');
      await loadTeams(activeJornada);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function handleGenerateFase1(sid) {
    if (!confirm('¿Generar los enfrentamientos? Cada jornada debe tener al menos 2 equipos.')) return;
    try {
      await api('/fase1/generate', { subtorneo_id: sid });
      showToast('🚀 ¡Fase de Grupos generada!', 'success');
      await loadSubtorneos(activeTournament);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  const currentTournament = tournaments.find(t => t.id === activeTournament);
  const currentSubtorneo  = subtorneos.find(s => s.id === activeSubtorneo);
  const currentJornada    = jornadas.find(j => j.id === activeJornada);

  const subtorneoConfig = {
    banquitas_m: { icon: '⚽', label: 'Banquitas Masculino', desc: 'Torneo de fútbol sala masculino' },
    banquitas_f: { icon: '⚽', label: 'Banquitas Femenino',  desc: 'Torneo de fútbol sala femenino'  },
    voleibol:    { icon: '🏐', label: 'Voleibol Mixto',      desc: 'Torneo de voleibol mixto'        },
    tenis:       { icon: '🏓', label: 'Tenis de Mesa',       desc: 'Torneo individual de tenis de mesa' },
  };

  const isSetup = currentSubtorneo?.status === 'setup';

  return (
    <div className="section" style={{ position: 'relative' }}>

      <h2>⚙️ Configuración</h2>
      <div className="section-theme-btn">
        <button
          className="btn-auth btn-login"
          style={{ position: 'static', fontSize: '0.8em', padding: '6px 14px' }}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
      </div>

      {/* Crear torneo */}
      <TournamentForm onSubmit={handleCreateTournament} />

      {/* Lista de torneos */}
      <div className="section-label">Torneos Existentes</div>
      {tournaments.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px' }}>
          <h3><span className="card-float-icon">📋</span> Sin torneos</h3>
          <p>Crea tu primer torneo arriba</p>
        </div>
      ) : (
        <div className="grid-2">
          {tournaments.map(t => (
            <div
              key={t.id}
              className={`card ${activeTournament === t.id ? 'card-active' : ''}`}
              onClick={() => handleSelectTournament(t.id)}
              style={{ cursor: 'pointer' }}
            >

              {/* Nombre — modo edición o display */}
              {editingTournament?.id === t.id ? (
                <div
                  style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    className="score-input"
                    style={{ flex: 1, fontSize: '1em', padding: '6px 10px', fontFamily: 'var(--font-title)' }}
                    value={editingTournament.name}
                    onChange={e => setEditingTournament({ ...editingTournament, name: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameTournament(t.id, editingTournament.name);
                      if (e.key === 'Escape') setEditingTournament(null);
                    }}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.8em' }}
                    onClick={() => handleRenameTournament(t.id, editingTournament.name)}
                  >✔</button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: '0.8em' }}
                    onClick={() => setEditingTournament(null)}
                  >✕</button>
                </div>
              ) : (
                <h3><span className="card-float-icon">🏆</span> {t.name}</h3>
              )}

              <p>{t.subtorneos_count || 4} subtorneos</p>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
                {/* Toggle de visibilidad */}
                <div
                  className={`visibility-toggle ${t.visible !== 0 ? 'visibility-toggle--on' : 'visibility-toggle--off'}`}
                  onClick={(e) => { e.stopPropagation(); handleToggleVisible(t.id); }}
                  title={t.visible !== 0 ? 'Ocultar torneo' : 'Mostrar torneo'}
                >
                  <div className="visibility-toggle-track">
                    <div className="visibility-toggle-thumb" />
                  </div>
                  <span className="visibility-toggle-label">
                    {t.visible !== 0 ? 'Visible' : 'Oculto'}
                  </span>
                </div>

                <button
                  className="btn btn-info"
                  style={{ padding: '6px 14px', fontSize: '0.8em' }}
                  onClick={(e) => { e.stopPropagation(); setEditingTournament({ id: t.id, name: t.name }); }}
                >
                  ✏️ Editar
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '6px 14px', fontSize: '0.8em' }}
                  onClick={(e) => { e.stopPropagation(); handleDeleteTournament(t.id); }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Subtorneos */}
      {activeTournament && (
        <>
          <div ref={refSubtorneos} className="section-divider"></div>
          <div className="section-label">Subtorneos — {currentTournament?.name}</div>

          <div className="sports-selector">
            {subtorneos.map(s => {
              const cfg = subtorneoConfig[s.type] || { icon: '🏅', label: s.name, desc: '' };
              const isActive = activeSubtorneo === s.id;
              return (
                <div
                  key={s.id}
                  className={`sport-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectSubtorneo(s.id)}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <div className="sport-icon">{cfg.icon}</div>
                  <h3>{cfg.label}</h3>
                  <p>{cfg.desc}</p>
                  <p style={{ marginTop: '8px', fontWeight: 700 }}>{s.teams_count || 0} equipos</p>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: 'auto', paddingTop: '14px' }}>
                    <span className={`badge ${statusBadgeClass(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
                    {s.status === 'setup' && (
                      <button
                        className="btn btn-success"
                        style={{ padding: '8px 18px', fontSize: '0.85em', width: '100%' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleGenerateFase1(s.id);
                        }}
                      >
                        🚀 Generar Fase de Grupos
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Jornadas */}
      {activeSubtorneo && (
        <>
          <div ref={refJornadas} className="section-divider"></div>
          <div className="section-label">Jornadas — {currentSubtorneo?.name}</div>

          <div className="grid-3">
            {jornadas.map(j => (
              <div
                key={j.id}
                className={`card ${activeJornada === j.id ? 'card-active' : ''}`}
                onClick={() => handleSelectJornada(j.id)}
                style={{ cursor: 'pointer' }}
              >
                <h3>📅 {j.name}</h3>
                <p>{j.teams_count || 0} equipos · {j.cupos_base} cupos</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Equipos */}
      {activeJornada && (
        <>
          <div ref={refEquipos} className="section-divider"></div>
          <div className="section-label">
            {currentSubtorneo?.type === 'tenis' ? 'Jugadores' : 'Equipos'} — {currentJornada?.name}
          </div>

          <TeamsList
            teams={teams}
            subtorneoType={currentSubtorneo?.type}
            onRemove={handleRemoveTeam}
            onRenameTeam={handleRenameTeam}
            onRenamePlayer={handleRenamePlayer}
            onRemovePlayer={handleRemovePlayer}
          />

          {isSetup && !showTeamForm && (
            <div className="btn-center" style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={() => setShowTeamForm(true)}>
                ➕ {currentSubtorneo?.type === 'tenis' ? 'Agregar Jugador' : 'Agregar Equipo'}
              </button>
            </div>
          )}

          {isSetup && showTeamForm && (
            <div style={{ marginTop: '20px' }}>
              <TeamForm onSubmit={handleAddTeam} subtorneoType={currentSubtorneo?.type} />
              <div className="btn-center">
                <button className="btn btn-danger" onClick={() => setShowTeamForm(false)}>
                  ✕ Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}