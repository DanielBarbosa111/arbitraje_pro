// =====================================================
// Arbitraje Pro — Fase 2: Bracket Eliminatorio
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import BracketView from './BracketView';

export default function Fase2Page({ showToast, isAdmin }) {
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [subtorneos, setSubtorneos] = useState([]);
  const [activeSubtorneo, setActiveSubtorneo] = useState(null);
  const [matches, setMatches] = useState([]);

  const refSubtorneos = useRef(null);
  const refBracket    = useRef(null);

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
    if (activeSubtorneo) scrollTo(refBracket);
  }, [activeSubtorneo]);


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
      setMatches([]);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadMatches(sid) {
    try {
      const data = await api(`/fase2/matches?subtorneo_id=${sid}`);
      setMatches(data);
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
    loadMatches(sid);
  }

  async function handleSaveResult(matchId, score1, score2, winnerTeamId, goals, cards) {
    try {
      await api('/fase2/save-result', {
        match_id: matchId,
        score1,
        score2,
        winner_team_id: winnerTeamId,
        goals: goals || [],
        cards: cards || [],
      });
      showToast('✅ Resultado guardado', 'success');
      await loadMatches(activeSubtorneo);
      await loadSubtorneos(activeTournament);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  const currentSubtorneo = subtorneos.find(s => s.id === activeSubtorneo);

  const subtorneoConfig = {
    banquitas_m: { icon: '⚽', label: 'Banquitas Masculino', desc: 'Torneo de fútbol sala masculino' },
    banquitas_f: { icon: '⚽', label: 'Banquitas Femenino',  desc: 'Torneo de fútbol sala femenino'  },
    voleibol:    { icon: '🏐', label: 'Voleibol Mixto',      desc: 'Torneo de voleibol mixto'        },
    tenis:       { icon: '🏓', label: 'Tenis de Mesa',       desc: 'Torneo individual de tenis de mesa' },
  };

  const subtorneosConBracket = subtorneos.filter(s => s.status === 'fase2' || s.status === 'finished');

  // Separar partidos por ronda
  const cuartos = matches.filter(m => m.round === 'cuartos');
  const semis = matches.filter(m => m.round === 'semis');
  const final_ = matches.filter(m => m.round === 'final');

  // Encontrar campeón
  const finalMatch = final_[0];
  const champion = finalMatch?.completed ? (finalMatch.winner_team_id === finalMatch.team1_id ? finalMatch.team1_name : finalMatch.team2_name) : null;

  return (
    <div className="section">
      <h2>🏆 Bracket Eliminatorio</h2>

      {/* Selector de torneo */}
      <div className="section-label">Selecciona un Torneo</div>
      <div className="grid-3">
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
      {activeTournament && subtorneosConBracket.length > 0 && (
        <>
          <div ref={refSubtorneos} className="section-divider"></div>
          <div className="section-label">Selecciona un Subtorneo</div>
          <div className="sports-selector">
            {subtorneosConBracket.map(s => {
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
                    <span className={`badge ${
                      s.status === 'finished' ? 'badge-success' :
                      s.status === 'fase2'    ? 'badge-warning' : 'badge-info'
                    }`}>
                      {s.status === 'finished' ? 'Estado: Finalizado' :
                       s.status === 'fase2'    ? 'Estado: En Llaves'  :
                                                 'Estado: Fase de Grupos'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTournament && subtorneosConBracket.length === 0 && (
        <>
          <div className="section-divider"></div>
          <div className="empty-state">
            <h3>⚠️ Sin brackets generados</h3>
            <p>Completa la Fase de Grupos y genera el bracket desde Clasificación</p>
          </div>
        </>
      )}

      {/* Campeón */}
      {champion && (
        <>
          <div className="section-divider"></div>
          <div className="champion-banner">
            <div className="champion-icon">🏆</div>
            <h3>¡CAMPEÓN!</h3>
            <p>{champion}</p>
          </div>
        </>
      )}

      {/* Bracket visual */}
      {activeSubtorneo && matches.length > 0 && (
        <>
          <div ref={refBracket} className="section-divider"></div>
          <div className="scroll-hint">
            <span className="scroll-hint-arrow">‹</span>
            <span>Desliza para ver la llave completa</span>
            <span className="scroll-hint-arrow">›</span>
          </div>
          <div className="bracket-scroll-wrapper">
            <BracketView
              cuartos={cuartos}
              semis={semis}
              final_={final_}
              isAdmin={isAdmin}
              currentSubtorneo={currentSubtorneo}
              onSaveResult={handleSaveResult}
            />
          </div>
        </>
      )}
    </div>
  );
}