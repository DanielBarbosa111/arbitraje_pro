// =====================================================
// Arbitraje Pro — Página de Clasificación
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';

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

export default function ClasificacionPage({ showToast, isAdmin }) {
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [subtorneos, setSubtorneos] = useState([]);
  const [activeSubtorneo, setActiveSubtorneo] = useState(null);
  const [clasificacion, setClasificacion] = useState(null);

  const refSubtorneos    = useRef(null);
  const refClasificacion = useRef(null);

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
    if (activeSubtorneo) scrollTo(refClasificacion);
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
      setClasificacion(null);
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  async function loadClasificacion(sid) {
    try {
      const data = await api(`/fase1/clasificacion?subtorneo_id=${sid}`);
      setClasificacion(data);
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
    loadClasificacion(sid);
  }

  async function handleGenerateFase2() {
    if (!clasificacion || clasificacion.total !== 8) {
      showToast('⚠️ Se necesitan exactamente 8 clasificados', 'warning');
      return;
    }
    if (!confirm('¿Generar la Llave eliminatoria con estos 8 equipos?')) return;

    try {
      const teamIds = clasificacion.clasificados.map(c => c.team_id);
      await api('/fase2/generate', {
        subtorneo_id: activeSubtorneo,
        clasificados: teamIds,
      });
      showToast('🏆 ¡Llave eliminatoria generada!', 'success');
      await loadSubtorneos(activeTournament);
      await loadClasificacion(activeSubtorneo);
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

  const subtorneosActivos = subtorneos.filter(s => s.status !== 'setup');

  return (
    <div className="section">
      <h2>🏅 Clasificados</h2>

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
            <p>Genera la Fase de Grupos desde Configuración</p>
          </div>
        </>
      )}

      {/* Distribución de cupos */}
      {clasificacion && (
        <>
          <div ref={refClasificacion} className="section-divider"></div>
          <div className="section-label">Distribución de Cupos — {currentSubtorneo?.name}</div>

          <div className="scroll-hint">
            <span className="scroll-hint-arrow">‹</span>
            <span>Desliza para ver la tabla completa</span>
            <span className="scroll-hint-arrow">›</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Jornada</th>
                  <th className="col-center">Equipos</th>
                  <th className="col-center">Cupos Base</th>
                  <th className="col-center">Cupos Final</th>
                </tr>
              </thead>
              <tbody>
                {clasificacion.cupos.map(c => (
                  <tr key={c.jornada_id}>
                    <td style={{ fontWeight: 700 }}>📅 {c.name}</td>
                    <td className="col-center">{c.teams_count}</td>
                    <td className="col-center">{c.cupos_base}</td>
                    <td className="col-center" style={{
                      color: c.cupos_final !== c.cupos_base ? 'var(--warning)' : 'var(--accent)',
                      fontWeight: 900,
                      fontFamily: 'var(--font-title)',
                    }}>
                      {c.cupos_final}
                      {c.cupos_final !== c.cupos_base && ' ⚠️'}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--accent-hover)' }}>
                  <td style={{ fontWeight: 900, color: 'var(--accent)' }}>TOTAL CLASIFICADOS</td>
                  <td className="col-center"></td>
                  <td className="col-center" style={{ fontWeight: 700 }}>8</td>
                  <td className="col-center" style={{
                    fontWeight: 900,
                    fontSize: '1.2em',
                    fontFamily: 'var(--font-title)',
                    color: clasificacion.total === 8 ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {clasificacion.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Lista de clasificados */}
          <div className="section-divider"></div>
          <div className="section-label">
            Equipos Clasificados ({clasificacion.total}/8)
          </div>

          {clasificacion.clasificados.length > 0 ? (
            <div className="grid-2">
              {clasificacion.clasificados.map((c, i) => (
                <div key={`${c.team_id}-${c.jornada_id}`} className="card clasificado-card">
                  <span className="clasificado-badge">Clasificado</span>
                  <h3 style={{ paddingRight: '80px' }}>
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`} {c.team_name}
                  </h3>
                  <p style={{ marginTop: '8px' }}>
                    📅 {c.jornada_name} · Posición #{c.position}
                  </p>
                  <p>
                    {c.pts} pts · DG: {c.dg > 0 ? '+' : ''}{c.dg} · GF: {c.gf}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px' }}>
              <h3>⏳ Sin clasificados aún</h3>
              <p>Completa los partidos de la Fase de Grupos para ver los clasificados</p>
            </div>
          )}

          {/* Botón generar llave */}
          {isAdmin && clasificacion.total === 8 && currentSubtorneo?.status === 'fase1' && (
            <>
              <div className="section-divider"></div>
              <div className="btn-center">
                <button className="btn btn-success" onClick={handleGenerateFase2}>
                  🏆 Generar Llave Eliminatoria (8 equipos)
                </button>
              </div>
            </>
          )}

          {clasificacion.total !== 8 && clasificacion.total > 0 && (
            <>
              <div className="section-divider"></div>
              <div className="empty-state" style={{ padding: '20px' }}>
                <p style={{ color: 'var(--warning)', fontWeight: 700 }}>
                  ⚠️ Se necesitan 8 clasificados para generar la Llave. Actualmente hay {clasificacion.total}.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}