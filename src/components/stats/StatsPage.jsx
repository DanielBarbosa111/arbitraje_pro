// =====================================================
// Arbitraje Pro — Estadísticas (Futurista v3)
// FIX: Animación de barras — parten de 0 y crecen al valor real
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';

// ── Hook: anima las barras de 0% al valor real.
//    Recibe la "llave" que identifica el set de datos actual (ej: el array items).
//    Cuando cambia la llave, resetea a false, espera dos frames para que el
//    browser pinte el DOM con width:0, y luego activa la transición CSS. ──────
function useAnimatedBars(key) {
  const [ready, setReady] = useState(false);
  // Convertimos la key a string estable para evitar comparaciones por referencia
  const keyStr = String(key);
  useEffect(() => {
    setReady(false);
    // frame 1: React pinta width:0 en el DOM
    // frame 2: el browser calcula layout → CSS transition se dispara hacia el valor real
    let id1, id2;
    id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr]);
  return ready;
}

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

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', 'var(--text-secondary)', 'var(--text-secondary)'];
const RANK_LABELS = ['\u{1F947}', '\u{1F948}', '\u{1F949}', '04', '05']; // 🥇 🥈 🥉

// ── Barra de progreso futurista ────────────────────────────────────────────
function TopBar({ items, valueKey, labelKey, subLabelKey, icon, invertMax, accentColor }) {
  const top5   = items ? items.slice(0, 5) : [];
  const ready  = useAnimatedBars(items ? items.length + JSON.stringify(items[0]) : null);

  if (!top5.length) return <p className="stats-empty">Sin datos aún</p>;

  const maxVal = invertMax
    ? (top5[top5.length - 1][valueKey] || 1)
    : (top5[0][valueKey] || 1);

  return (
    <div className="stats-bar-list">
      {top5.map((item, i) => {
        const val = item[valueKey] ?? 0;
        const pct = invertMax
          ? Math.round(((maxVal - val + 1) / (maxVal + 1)) * 100)
          : Math.round((val / maxVal) * 100);

        // accentColor siempre debe ser un hex real, no una var() CSS
        const barBg = accentColor
          ? `linear-gradient(90deg, ${accentColor}99, ${accentColor})`
          : 'linear-gradient(90deg, #00c97a, #00ff88)';
        const barShadow = accentColor
          ? `0 0 10px ${accentColor}99`
          : '0 0 10px rgba(0,255,136,0.6)';
        const barStyle = {
          width: ready ? `${pct}%` : '0%',
          background: barBg,
          boxShadow: barShadow,
        };

        return (
          <div key={i} className="stats-bar-row" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stats-bar-meta">
              <span
                className="stats-bar-rank"
                style={{
                  color:    RANK_COLORS[i],
                  fontSize: i < 3 ? '1.3em' : '0.78em',
                  opacity:  i < 3 ? 1 : 0.7,
                }}
              >
                {RANK_LABELS[i]}
              </span>

              <div className="stats-bar-info">
                <span className="stats-bar-name">{item[labelKey]}</span>
                {subLabelKey && item[subLabelKey] && (
                  <span className="stats-bar-sub">{item[subLabelKey]}</span>
                )}
              </div>

              <span className="stats-bar-value" style={{ color: accentColor || 'var(--accent)' }}>
                {val}<span className="stats-bar-icon">{icon}</span>
              </span>
            </div>

            <div className="stats-bar-track">
              <div className="stats-bar-fill" style={barStyle} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KpiCard({ icon, value, label, color }) {
  return (
    <div className="stats-kpi" style={{ '--kpi-color': color || 'var(--accent)' }}>
      <div className="stats-kpi-icon">{icon}</div>
      <div className="stats-kpi-value" style={{ color: color || 'var(--accent)', textShadow: `0 0 16px ${color || 'var(--accent-glow)'}` }}>
        {value}
      </div>
      <div className="stats-kpi-label">{label}</div>
    </div>
  );
}

// ── Cabecera de sección ────────────────────────────────────────────────────
function SectionHeader({ icon, title, accent }) {
  return (
    <div className="stats-section-header" style={{ '--sh-color': accent || 'var(--accent)' }}>
      <span className="stats-section-icon">{icon}</span>
      <span className="stats-section-title" style={{ color: accent || 'var(--accent)' }}>{title}</span>
      <div className="stats-section-line" style={{ background: `linear-gradient(90deg, ${accent || 'var(--accent)'}, transparent)` }} />
    </div>
  );
}

// ── Barras de tarjetas AM / AR ─────────────────────────────────────────────
function CardsBar({ items }) {
  const top5  = items ? items.slice(0, 5) : [];
  const ready = useAnimatedBars(items ? items.length + JSON.stringify(items[0]) : null);

  if (!top5.length) return <p className="stats-empty">Sin datos aún</p>;

  const maxTotal = (top5[0].yellow_cards || 0) + (top5[0].red_cards || 0) * 2 || 1;

  return (
    <div className="stats-bar-list">
      {top5.map((item, i) => {
        const yellows = item.yellow_cards || 0;
        const blues   = item.blue_cards   || 0;
        const total   = yellows + blues * 2;
        const pct     = Math.round((total / maxTotal) * 100);

        return (
          <div key={i} className="stats-bar-row" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stats-bar-meta">
              <span
                className="stats-bar-rank"
                style={{ color: RANK_COLORS[i], fontSize: i < 3 ? '1.3em' : '0.78em', opacity: i < 3 ? 1 : 0.7 }}
              >
                {RANK_LABELS[i]}
              </span>
              <div className="stats-bar-info">
                <span className="stats-bar-name">{item.player_name || item.name}</span>
                {item.team_name && <span className="stats-bar-sub">{item.team_name}</span>}
              </div>
              <div className="stats-cards-badges">
                <span className="stats-card-badge stats-card-yellow">{yellows} AM</span>
                <span className="stats-card-badge stats-card-blue">{blues} AZ</span>
              </div>
            </div>
            <div className="stats-bar-track">
              <div className="stats-bar-fill" style={{
                width:      ready ? `${pct}%` : '0%',
                background: 'linear-gradient(90deg, #e67e22, #ff4757)',
                boxShadow:  '0 0 8px rgba(255,71,87,0.5)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Partidos destacados ────────────────────────────────────────────────────
function HighlightedMatches({ matches }) {
  if (!matches || !matches.length) return <p className="stats-empty">Sin datos aún</p>;

  const ready    = useAnimatedBars(matches ? matches.length + JSON.stringify(matches[0]) : null);
  const flameIcons = ['🔥', '⚡', '💥', '⭐', '✨'];
  const maxGoals = matches[0].total_goals || 1;

  return (
    <div className="stats-matches-list">
      {matches.slice(0, 5).map((m, i) => {
        const pct = Math.round((m.total_goals / maxGoals) * 100);
        return (
          <div key={i} className="stats-match-row" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="stats-match-header">
              <span className="stats-match-flame">{flameIcons[i]}</span>
              <div className="stats-match-teams">
                <span className="stats-match-team" style={{
                  color:      m.winner === 1 ? 'var(--accent)' : 'var(--text-secondary)',
                  textShadow: m.winner === 1 ? '0 0 8px var(--accent-glow)' : 'none',
                  fontWeight: m.winner === 1 ? 900 : 600,
                }}>
                  {m.team1_name}
                </span>

                <div className="stats-match-scorebox">
                  <span className={`stats-match-score ${m.winner === 1 ? 'score-w1' : m.winner === 2 ? 'score-w2' : 'score-draw'}`}>
                    {m.score1}
                  </span>
                  <span className="stats-match-dash">—</span>
                  <span className={`stats-match-score ${m.winner === 2 ? 'score-w2' : m.winner === 1 ? 'score-w1' : 'score-draw'}`}>
                    {m.score2}
                  </span>
                </div>

                <span className="stats-match-team stats-match-team-right" style={{
                  color:      m.winner === 2 ? 'var(--accent)' : 'var(--text-secondary)',
                  textShadow: m.winner === 2 ? '0 0 8px var(--accent-glow)' : 'none',
                  fontWeight: m.winner === 2 ? 900 : 600,
                }}>
                  {m.team2_name}
                </span>
              </div>
              <span className="stats-match-total">{m.total_goals} ⚽</span>
            </div>
            <div className="stats-bar-track" style={{ marginTop: '8px' }}>
              <div className="stats-bar-fill" style={{
                width:      ready ? `${pct}%` : '0%',
                background: 'linear-gradient(90deg, #9b59b6, #e74c3c)',
                boxShadow:  '0 0 8px rgba(155,89,182,0.5)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Equipos más goleados ───────────────────────────────────────────────────
function WorstDefenses({ items }) {
  if (!items || !items.length) return <p className="stats-empty">Sin datos aún</p>;

  const reversed = [...items].sort((a, b) => b.conceded - a.conceded).slice(0, 5);
  const ready    = useAnimatedBars(items ? items.length + JSON.stringify(items[0]) : null);
  const maxVal   = reversed[0].conceded || 1;

  return (
    <div className="stats-bar-list">
      {reversed.map((item, i) => {
        const val = item.conceded ?? 0;
        const pct = Math.round((val / maxVal) * 100);
        return (
          <div key={i} className="stats-bar-row" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stats-bar-meta">
              <span
                className="stats-bar-rank"
                style={{ color: '#ff4757', fontSize: i < 3 ? '1.3em' : '0.78em', opacity: i < 3 ? 1 : 0.7 }}
              >
                {RANK_LABELS[i]}
              </span>
              <div className="stats-bar-info">
                <span className="stats-bar-name">{item.name}</span>
              </div>
              <span className="stats-bar-value" style={{ color: '#ff4757' }}>
                {val}<span className="stats-bar-icon">🚨</span>
              </span>
            </div>
            <div className="stats-bar-track">
              <div className="stats-bar-fill" style={{
                width:      ready ? `${pct}%` : '0%',
                background: 'linear-gradient(90deg, #c0392b, #ff4757)',
                boxShadow:  '0 0 8px rgba(255,71,87,0.5)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
export default function StatsPage({ showToast }) {
  const [tournaments, setTournaments]           = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [subtorneos, setSubtorneos]             = useState([]);
  const [activeSubtorneo, setActiveSubtorneo]   = useState(null);
  const [stats, setStats]                       = useState(null);
  const [statsTab, setStatsTab]                 = useState('jugadores');

  const refSubtorneos = useRef(null);
  const refStats      = useRef(null);

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
    if (activeSubtorneo) scrollTo(refStats);
  }, [activeSubtorneo]);


  async function loadTournaments() {
    try { setTournaments((await api('/tournaments/list')).filter(t => t.visible !== 0)); }
    catch (err) { showToast(err.message, 'danger'); }
  }

  async function loadSubtorneos(tid) {
    try {
      setSubtorneos(await api(`/jornadas/subtorneos?tournament_id=${tid}`));
      setActiveSubtorneo(null);
      setStats(null);
    } catch (err) { showToast(err.message, 'danger'); }
  }

  async function loadStatsSubtorneo(sid) {
    try {
      setStats(await api(`/stats/subtorneo?subtorneo_id=${sid}`));
    } catch (err) { showToast(err.message, 'danger'); }
  }

  function handleSelectTournament(tid) {
    setActiveTournament(tid);
    setStats(null);
    setActiveSubtorneo(null);
    loadSubtorneos(tid);
  }

  function handleSelectSubtorneo(sid) {
    setActiveSubtorneo(sid);
    loadStatsSubtorneo(sid);
  }

  useEffect(() => { loadTournaments(); }, []);

  const subtorneoConfig = {
    banquitas_m: { icon: '⚽', label: 'Banquitas Masculino', desc: 'Torneo de fútbol sala masculino' },
    banquitas_f: { icon: '⚽', label: 'Banquitas Femenino',  desc: 'Torneo de fútbol sala femenino'  },
    voleibol:    { icon: '🏐', label: 'Voleibol Mixto',      desc: 'Torneo de voleibol mixto'        },
    tenis:       { icon: '🏓', label: 'Tenis de Mesa',       desc: 'Torneo individual de tenis de mesa' },
  };
  const subtorneosActivos = subtorneos.filter(s => s.status !== 'setup');

  return (
    <div className="section">
      <h2>📊 Estadísticas</h2>

      {/* ── Selector de torneo ── */}
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

      {/* ── Subtorneos ── */}
      {activeTournament && subtorneosActivos.length > 0 && (
        <>
          <div ref={refSubtorneos} className="section-divider" />
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
          <div className="section-divider" />
          <div className="empty-state">
            <h3>⚠️ Sin subtorneos activos</h3>
            <p>Genera la Fase de Grupos desde Configuración</p>
          </div>
        </>
      )}

      {/* ── Bloque de estadísticas ── */}
      {stats && (
        <>
          <div ref={refStats} className="section-divider" />

          {/* KPIs globales */}
          <div className="stats-kpi-grid">
            <KpiCard icon="🏆" value={tournaments.length}     label="Torneos activos" />
            <KpiCard icon="👥" value={stats.total_teams ?? 0}  label="Equipos" />
            <KpiCard icon="🧍" value={stats.total_players ?? 0} label="Jugadores" />
            <KpiCard icon="🎮" value={stats.matches_played}    label="Partidos jugados" />
            <KpiCard icon="⏳" value={stats.total_matches - stats.matches_played} label="Restantes" />
          </div>

          {/* ── Tab switcher ── */}
          <div className="stats-tab-bar">
            <button
              className={`stats-tab-btn ${statsTab === 'jugadores' ? 'stats-tab-active' : ''}`}
              onClick={() => setStatsTab('jugadores')}
            >
              <span className="stats-tab-icon">👤</span>
              Jugadores
            </button>
            <button
              className={`stats-tab-btn ${statsTab === 'equipos' ? 'stats-tab-active' : ''}`}
              onClick={() => setStatsTab('equipos')}
            >
              <span className="stats-tab-icon">🛡️</span>
              Equipos
            </button>
          </div>

          {/* ══════════ PANEL JUGADORES ══════════ */}
          {statsTab === 'jugadores' && (
            <div className="stats-panel">

              <div className="stats-block">
                <SectionHeader icon="⚽" title="Jugadores más goleadores" accent="var(--accent)" />
                <div className="stats-top-card stats-top-card--accent">
                  <TopBar
                    items={stats.top_scorers}
                    valueKey="goals"
                    labelKey="player_name"
                    subLabelKey="team_name"
                    icon=" ⚽"
                    accentColor="#00ff88"
                  />
                </div>
              </div>

              <div className="stats-block">
                <SectionHeader icon="🟨" title="Jugadores con más tarjetas" accent="#f39c12" />
                <div className="stats-top-card stats-top-card--warning">
                  {stats.top_cards_players && stats.top_cards_players.length > 0 ? (
                    <CardsBar items={stats.top_cards_players} />
                  ) : (
                    <p className="stats-empty" style={{ color: 'var(--text-secondary)' }}>
                      Sin tarjetas registradas en este subtorneo
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ══════════ PANEL EQUIPOS ══════════ */}
          {statsTab === 'equipos' && (
            <div className="stats-panel">

              <div className="stats-block">
                <SectionHeader icon="⚽" title="Equipos más goleadores" accent="var(--accent)" />
                <div className="stats-top-card stats-top-card--accent">
                  <TopBar
                    items={stats.top_teams}
                    valueKey="goals"
                    labelKey="name"
                    icon=" ⚽"
                    accentColor="#00ff88"
                  />
                </div>
              </div>

              <div className="stats-block">
                <SectionHeader icon="🛡️" title="Equipos con mejor defensa" accent="#3498db" />
                <div className="stats-top-card stats-top-card--info">
                  <TopBar
                    items={stats.best_defenses}
                    valueKey="conceded"
                    labelKey="name"
                    icon=" 🚫"
                    invertMax
                    accentColor="#3498db"
                  />
                </div>
              </div>

              <div className="stats-block">
                <SectionHeader icon="🟨" title="Equipos con más tarjetas" accent="#f39c12" />
                <div className="stats-top-card stats-top-card--warning">
                  {stats.top_cards_teams && stats.top_cards_teams.length > 0 ? (
                    <CardsBar items={stats.top_cards_teams} />
                  ) : (
                    <p className="stats-empty" style={{ color: 'var(--text-secondary)' }}>
                      Sin tarjetas registradas en este subtorneo
                    </p>
                  )}
                </div>
              </div>

              {stats.highlighted_matches && stats.highlighted_matches.length > 0 && (
                <div className="stats-block">
                  <SectionHeader icon="🔥" title="Partidos destacados" accent="#9b59b6" />
                  <div className="stats-top-card stats-top-card--purple">
                    <HighlightedMatches matches={stats.highlighted_matches} />
                  </div>
                </div>
              )}

              {stats.best_defenses && stats.best_defenses.length > 0 && (
                <div className="stats-block">
                  <SectionHeader icon="📉" title="Equipos más goleados" accent="#ff4757" />
                  <div className="stats-top-card stats-top-card--danger">
                    <WorstDefenses items={stats.best_defenses} />
                  </div>
                </div>
              )}

            </div>
          )}

          {stats.matches_played === 0 && (
            <div className="empty-state" style={{ padding: '30px' }}>
              <h3>📈 Sin datos aún</h3>
              <p>Juega algunos partidos para ver estadísticas</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}