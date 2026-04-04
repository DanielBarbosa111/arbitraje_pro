// =====================================================
// Arbitraje Pro — Equipos (vista pública, solo lectura)
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';

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

const subtorneoConfig = {
  banquitas_m: { icon: '⚽', label: 'Banquitas Masculino', desc: 'Torneo de fútbol sala masculino' },
  banquitas_f: { icon: '⚽', label: 'Banquitas Femenino',  desc: 'Torneo de fútbol sala femenino'  },
  voleibol:    { icon: '🏐', label: 'Voleibol Mixto',      desc: 'Torneo de voleibol mixto'        },
  tenis:       { icon: '🏓', label: 'Tenis de Mesa',       desc: 'Torneo individual de tenis de mesa' },
};

export default function EquiposPage({ showToast }) {
  const [tournaments, setTournaments]     = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [subtorneos, setSubtorneos]       = useState([]);
  const [activeSubtorneo, setActiveSubtorneo]   = useState(null);
  const [jornadas, setJornadas]           = useState([]);
  const [activeJornada, setActiveJornada] = useState(null);
  const [teams, setTeams]                 = useState([]);
  const [loading, setLoading]             = useState(false);

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


  async function loadTournaments() {
    try {
      const data = await api('/tournaments/list');
      setTournaments(data.filter(t => t.visible !== 0));
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadSubtorneos(tid) {
    try {
      const data = await api(`/jornadas/subtorneos?tournament_id=${tid}`);
      setSubtorneos(data);
      setActiveSubtorneo(null);
      setJornadas([]);
      setActiveJornada(null);
      setTeams([]);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadJornadas(sid) {
    try {
      const data = await api(`/jornadas/list?subtorneo_id=${sid}`);
      setJornadas(data);
      setActiveJornada(null);
      setTeams([]);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadTeams(jid) {
    setLoading(true);
    try {
      const data = await api(`/teams/list?jornada_id=${jid}`);
      setTeams(data);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTournament(tid) {
    setActiveTournament(tid);
    loadSubtorneos(tid);
  }

  function handleSelectSubtorneo(sid) {
    setActiveSubtorneo(sid);
    loadJornadas(sid);
  }

  function handleSelectJornada(jid) {
    setActiveJornada(jid);
    loadTeams(jid);
  }

  useEffect(() => { loadTournaments(); }, []);

  const currentTournament = tournaments.find(t => t.id === activeTournament);
  const currentSubtorneo  = subtorneos.find(s => s.id === activeSubtorneo);
  const currentJornada    = jornadas.find(j => j.id === activeJornada);
  const isTenis           = currentSubtorneo?.type === 'tenis';

  return (
    <div className="section">
      <h2>👥 Equipos</h2>

      {/* ── Torneos ── */}
      <div className="section-label">Selecciona un Torneo</div>
      {tournaments.length === 0 ? (
        <div className="empty-state" style={{ padding: '30px' }}>
          <h3><span className="card-float-icon">📋</span> Sin torneos</h3>
          <p>Aún no hay torneos registrados</p>
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
              <h3><span className="card-float-icon">🏆</span> {t.name}</h3>
              <p>{t.subtorneos_count || 4} subtorneos</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Subtorneos ── */}
      {activeTournament && (
        <>
          <div ref={refSubtorneos} className="section-divider" />
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
                  <div style={{ marginTop: 'auto', paddingTop: '14px', display: 'flex', justifyContent: 'center' }}>
                    <span className={`badge ${statusBadgeClass(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Jornadas ── */}
      {activeSubtorneo && (
        <>
          <div ref={refJornadas} className="section-divider" />
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
                <p>{j.teams_count || 0} {isTenis ? 'jugadores' : 'equipos'} · {j.cupos_base} cupos</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Equipos (solo lectura) ── */}
      {activeJornada && (
        <>
          <div ref={refEquipos} className="section-divider" />
          <div className="section-label">
            {isTenis ? 'Jugadores' : 'Equipos'} — {currentJornada?.name}
          </div>

          {loading ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <p>Cargando...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <h3>{isTenis ? '🏓 Sin jugadores' : '⚽ Sin equipos'}</h3>
              <p>No hay {isTenis ? 'jugadores' : 'equipos'} registrados en esta jornada</p>
            </div>
          ) : (
            <div className="teams-grid">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className="team-card"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div className="team-card-top" />

                  <div className="team-card-header">
                    <div className="team-card-icon">
                      {isTenis ? '🏓' : '⚽'}
                    </div>
                    <h3 className="team-card-name" style={{ flex: 1 }}>
                      {team.name}
                    </h3>
                  </div>

                  {!isTenis && team.players && team.players.length > 0 && (
                    <>
                      <div className="team-card-count">
                        {team.players.length} jugadores
                      </div>
                      <ul className="team-players-list">
                        {team.players.map((p, i) => (
                          <li key={p.id} className="team-player-item" style={{ animationDelay: `${i * 0.04}s` }}>
                            <span className="team-player-number">{i + 1}</span>
                            <span className="team-player-name">{p.name}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}