// =====================================================
// Arbitraje Pro — Fase de Grupos
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import MatchResultForm from './MatchResultForm';
import PositionsTable from './PositionsTable';

// Traduce los estados internos a etiquetas legibles
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

export default function Fase1Page({ showToast, isAdmin }) {
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [subtorneos, setSubtorneos] = useState([]);
  const [activeSubtorneo, setActiveSubtorneo] = useState(null);
  const [jornadas, setJornadas] = useState([]);
  const [activeJornada, setActiveJornada] = useState(null);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);

  // Refs para scroll automático al seleccionar
  const refSubtorneos = useRef(null);
  const refJornadas   = useRef(null);
  const refPartidos   = useRef(null);

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
    if (activeJornada) scrollTo(refPartidos);
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
      setMatches([]);
      setStandings([]);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadJornadas(sid) {
    try {
      const data = await api(`/jornadas/list?subtorneo_id=${sid}`);
      setJornadas(data);
      setActiveJornada(null);
      setMatches([]);
      setStandings([]);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadMatches(jid) {
    try {
      const data = await api(`/fase1/matches?jornada_id=${jid}`);
      setMatches(data);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadStandings(jid) {
    try {
      const data = await api(`/fase1/standings?jornada_id=${jid}`);
      setStandings(data);
    } catch (err) {
      showToast(err.message, 'danger');
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
    loadMatches(jid);
    loadStandings(jid);
  }

  async function handleSaveResult(matchId, score1, score2, goals, cards) {
    try {
      await api('/fase1/save-result', {
        match_id: matchId,
        score1,
        score2,
        goals: goals || [],
        cards: cards || [],
      });
      showToast('✅ Resultado guardado', 'success');
      await loadMatches(activeJornada);
      await loadStandings(activeJornada);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  const currentSubtorneo = subtorneos.find(s => s.id === activeSubtorneo);
  const scoreLabel = currentSubtorneo?.type === 'banquitas_m' || currentSubtorneo?.type === 'banquitas_f'
    ? 'Goles' : 'Sets';

  const subtorneoConfig = {
    banquitas_m: { icon: '⚽', label: 'Banquitas Masculino', desc: 'Torneo de fútbol sala masculino' },
    banquitas_f: { icon: '⚽', label: 'Banquitas Femenino',  desc: 'Torneo de fútbol sala femenino'  },
    voleibol:    { icon: '🏐', label: 'Voleibol Mixto',      desc: 'Torneo de voleibol mixto'        },
    tenis:       { icon: '🏓', label: 'Tenis de Mesa',       desc: 'Torneo individual de tenis de mesa' },
  };

  const subtorneosActivos = subtorneos.filter(s => s.status !== 'setup');

  return (
    <div className="section">
      <h2>⚽ Fase de Grupos</h2>

      {/* Selector de torneo */}
      <div className="section-label">Selecciona un Torneo</div>
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

      {tournaments.length === 0 && (
        <div className="empty-state">
          <h3><span className="card-float-icon">📋</span> Sin torneos</h3>
          <p>Crea un torneo en Configuración</p>
        </div>
      )}

      {/* Selector de subtorneo */}
      {activeTournament && subtorneosActivos.length > 0 && (
        <>
          <div ref={refSubtorneos} className="section-divider"></div>
          <div className="section-label">Selecciona un Subtorneo</div>
          <div className="sports-selector">
            {subtorneosActivos.map(s => {
              const cfg = subtorneoConfig[s.type] || { icon: '🏅', label: s.name, desc: '' };
              return (
                <div
                  key={s.id}
                  className={`sport-card ${activeSubtorneo === s.id ? 'active' : ''}`}
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

      {activeTournament && subtorneosActivos.length === 0 && (
        <>
          <div className="section-divider"></div>
          <div className="empty-state">
            <h3>⚠️ Sin subtorneos activos</h3>
            <p>Genera la Fase de Grupos desde Configuración para ver los enfrentamientos</p>
          </div>
        </>
      )}

      {/* Selector de jornada */}
      {activeSubtorneo && (
        <>
          <div ref={refJornadas} className="section-divider"></div>
          <div className="section-label">Selecciona una Jornada</div>
          <div className="grid-3">
            {jornadas.map(j => {
              const hasTeams = (j.teams_count || 0) >= 2;
              return (
                <div
                  key={j.id}
                  className={`card ${activeJornada === j.id ? 'card-active' : ''} ${!hasTeams ? 'card-disabled' : ''}`}
                  onClick={() => hasTeams && handleSelectJornada(j.id)}
                  style={{ cursor: hasTeams ? 'pointer' : 'not-allowed', opacity: hasTeams ? 1 : 0.5 }}
                >
                  <h3>📅 {j.name}</h3>
                  <p>{j.teams_count || 0} equipos</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Tabla de posiciones */}
      {activeJornada && standings.length > 0 && (
        <>
          <div className="section-divider"></div>
          <div className="section-label">Tabla de Posiciones</div>
          <div className="scroll-hint">
            <span className="scroll-hint-arrow">‹</span>
            <span>Desliza para ver la tabla completa</span>
            <span className="scroll-hint-arrow">›</span>
          </div>
          <PositionsTable
            standings={standings}
            scoreLabel={scoreLabel}
            cupos={jornadas.find(j => j.id === activeJornada)?.cupos_base || 2}
          />
        </>
      )}

      {/* Partidos */}
      {activeJornada && matches.length > 0 && (
        <>
          <div ref={refPartidos} className="section-divider"></div>
          <div className="section-label">Partidos</div>
          {matches.map(m => (
            <MatchResultForm
              key={m.id}
              match={m}
              scoreLabel={scoreLabel}
              isAdmin={isAdmin}
              onSave={handleSaveResult}
              subtorneoType={currentSubtorneo?.type}
            />
          ))}
        </>
      )}

      {activeJornada && matches.length === 0 && (
        <>
          <div className="section-divider"></div>
          <div className="empty-state">
            <h3><span className="card-float-icon">⚽</span> Sin partidos</h3>
            <p>No hay enfrentamientos generados para esta jornada</p>
          </div>
        </>
      )}
    </div>
  );
}