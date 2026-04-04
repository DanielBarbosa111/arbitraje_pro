// =====================================================
// Arbitraje Pro — Formulario de resultado con goles, tarjetas y resumen
// =====================================================

import { useState } from 'react';
import { api } from '../../api/client';

export default function MatchResultForm({ match, scoreLabel, isAdmin, onSave, subtorneoType }) {
  const [score1, setScore1] = useState(match.score1 || 0);
  const [score2, setScore2] = useState(match.score2 || 0);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(null); // null, 'goals', 'cards'
  const [goals, setGoals] = useState([]);
  const [cards, setCards] = useState([]);
  const [players1, setPlayers1] = useState([]);
  const [players2, setPlayers2] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  const isBanquitas = subtorneoType === 'banquitas_m' || subtorneoType === 'banquitas_f';

  async function loadPlayers() {
    try {
      const param = match.jornada_id
        ? `jornada_id=${match.jornada_id}`
        : `subtorneo_id=${match.subtorneo_id}`;
      const data = await api(`/teams/list?${param}`);
      const team1 = data.find(t => t.id === match.team1_id);
      const team2 = data.find(t => t.id === match.team2_id);
      setPlayers1(team1?.players || []);
      setPlayers2(team2?.players || []);
    } catch (err) {
      console.error(err);
    }
  }

  // Paso 1: Ingresar marcador → Paso 2: Asignar goles
  function handleNextStep() {
    loadPlayers();

    // Si está editando, precargar goles existentes ajustados al nuevo marcador
    const existingGoals = match.goals || [];
    const existingCards = match.cards || [];

    // Goles equipo 1: reusar los existentes, completar o recortar según nuevo score1
    const prevGoalsT1 = existingGoals.filter(g => g.team_id === match.team1_id);
    const prevGoalsT2 = existingGoals.filter(g => g.team_id === match.team2_id);

    const newGoals = [];
    for (let i = 0; i < score1; i++) {
      newGoals.push({
        team_id: match.team1_id,
        team_name: match.team1_name,
        player_name: prevGoalsT1[i]?.player_name || '',
      });
    }
    for (let i = 0; i < score2; i++) {
      newGoals.push({
        team_id: match.team2_id,
        team_name: match.team2_name,
        player_name: prevGoalsT2[i]?.player_name || '',
      });
    }

    // Tarjetas: reusar las existentes completas
    const preloadedCards = existingCards.map(c => ({
      team_id:     c.team_id,
      team_name:   c.team_id === match.team1_id ? match.team1_name : match.team2_name,
      player_name: c.player_name || '',
      card_type:   c.card_type || 'yellow',
    }));

    setGoals(newGoals);
    setCards(preloadedCards);

    if (score1 + score2 > 0) {
      setStep('goals');
    } else if (isBanquitas) {
      setStep('cards');
    } else {
      onSave(match.id, score1, score2, [], preloadedCards);
    }
  }

  function handleGoalPlayerChange(index, playerName) {
    const updated = [...goals];
    updated[index].player_name = playerName;
    setGoals(updated);
  }

  // Después de goles → tarjetas (solo banquitas)
  function handleGoalsDone() {
    if (isBanquitas) {
      setStep('cards');
    } else {
      handleFinalSave();
    }
  }

  // Agregar tarjeta
  function addCard(teamId, teamName) {
    setCards([...cards, { team_id: teamId, team_name: teamName, player_name: '', card_type: 'yellow' }]);
  }

  function handleCardChange(index, field, value) {
    const updated = [...cards];
    updated[index][field] = value;
    setCards(updated);
  }

  function removeCard(index) {
    setCards(cards.filter((_, i) => i !== index));
  }

  // Guardar todo
  function handleFinalSave() {
    const validGoals = goals.filter(g => g.player_name.trim());
    const validCards = cards.filter(c => c.player_name.trim());
    onSave(match.id, score1, score2, validGoals, validCards);
    setStep(null);
    setEditing(false);
  }

  const team1Wins = match.completed && match.score1 > match.score2;
  const team2Wins = match.completed && match.score2 > match.score1;
  const isDraw = match.completed && match.score1 === match.score2;

  // ── PASO: Asignar goles ──
  if (step === 'goals') {
    const goalsTeam1 = goals.filter(g => g.team_id === match.team1_id);
    const goalsTeam2 = goals.filter(g => g.team_id === match.team2_id);

    return (
      <div className="match-card">
        <div className="goals-assign-header">
          <h3>⚽ Asignar Goleadores</h3>
          <p>{match.team1_name} {score1} — {score2} {match.team2_name}</p>
        </div>

        {goalsTeam1.length > 0 && (
          <div className="goals-assign-team">
            <h4>{match.team1_name}</h4>
            {goalsTeam1.map((g, i) => {
              const globalIndex = goals.indexOf(g);
              return (
                <div key={globalIndex} className="goal-assign-row">
                  <span className="goal-assign-label">Gol {i + 1}:</span>
                  <select
                    value={g.player_name}
                    onChange={e => handleGoalPlayerChange(globalIndex, e.target.value)}
                    className="goal-assign-select"
                  >
                    <option value="">— Seleccionar jugador —</option>
                    {players1.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {goalsTeam2.length > 0 && (
          <div className="goals-assign-team">
            <h4>{match.team2_name}</h4>
            {goalsTeam2.map((g, i) => {
              const globalIndex = goals.indexOf(g);
              return (
                <div key={globalIndex} className="goal-assign-row">
                  <span className="goal-assign-label">Gol {i + 1}:</span>
                  <select
                    value={g.player_name}
                    onChange={e => handleGoalPlayerChange(globalIndex, e.target.value)}
                    className="goal-assign-select"
                  >
                    <option value="">— Seleccionar jugador —</option>
                    {players2.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        <div className="btn-center">
          <button className="btn btn-primary" onClick={handleGoalsDone}>
            ✔ {isBanquitas ? 'Siguiente → Tarjetas' : 'Guardar'}
          </button>
          <button className="btn btn-danger" onClick={() => setStep(null)}>
            ✕ Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── PASO: Asignar tarjetas (solo banquitas) ──
  if (step === 'cards') {
    return (
      <div className="match-card">
        <div className="goals-assign-header">
          <h3>🃏 Asignar Tarjetas</h3>
          <p>{match.team1_name} {score1} — {score2} {match.team2_name}</p>
        </div>

        {cards.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '12px 0' }}>
            Sin tarjetas — agrega si hubo alguna
          </p>
        )}

        {/* Agrupar tarjetas por equipo */}
        {[
          { teamId: match.team1_id, teamName: match.team1_name, players: players1, btnClass: 'btn-warning' },
          { teamId: match.team2_id, teamName: match.team2_name, players: players2, btnClass: 'btn-info'    },
        ].map(({ teamId, teamName, players, btnClass }) => {
          const teamCards = cards.map((c, i) => ({ ...c, _i: i })).filter(c => c.team_id === teamId);
          return (
            <div key={teamId} className="cards-team-group">
              {/* Encabezado del equipo */}
              <div className="cards-team-header">
                <span className="cards-team-label">{teamName}</span>
                <button
                  className={`btn ${btnClass}`}
                  style={{ padding: '4px 14px', fontSize: '0.8em' }}
                  onClick={() => addCard(teamId, teamName)}
                >
                  + Tarjeta
                </button>
              </div>

              {teamCards.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85em', padding: '6px 0', textAlign: 'center' }}>
                  Sin tarjetas
                </p>
              )}

              {teamCards.map(c => (
                <div key={c._i} className="card-assign-row">
                  <button className="team-card-delete card-delete-btn" onClick={() => removeCard(c._i)}>✕</button>

                  {/* Solo tipo de tarjeta */}
                  <div className="card-field">
                    <span className="card-field-label">Tarjeta</span>
                    <div className="card-type-btns">
                      <button
                        className={`card-type-btn ${c.card_type === 'yellow' ? 'card-type-btn--active-yellow' : ''}`}
                        onClick={() => handleCardChange(c._i, 'card_type', 'yellow')}
                      >
                        🟨 Amarilla
                      </button>
                      <button
                        className={`card-type-btn ${c.card_type === 'blue' ? 'card-type-btn--active-blue' : ''}`}
                        onClick={() => handleCardChange(c._i, 'card_type', 'blue')}
                      >
                        🟦 Azul
                      </button>
                    </div>
                  </div>

                  {/* Jugador del equipo */}
                  <div className="card-field">
                    <span className="card-field-label">Jugador</span>
                    <select
                      value={c.player_name}
                      onChange={e => handleCardChange(c._i, 'player_name', e.target.value)}
                      className="goal-assign-select"
                    >
                      <option value="">— Seleccionar jugador —</option>
                      {players.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        <div className="btn-center">
          <button className="btn btn-primary" onClick={handleFinalSave}>
            ✔ Guardar Todo
          </button>
          <button className="btn btn-danger" onClick={() => setStep(null)}>
            ✕ Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Resumen del partido (inline, dentro de la tarjeta) ──
  if (showSummary) {
    const matchGoals = match.goals || [];
    const matchCards = match.cards || [];
    const goalsT1  = matchGoals.filter(g => g.team_id === match.team1_id);
    const goalsT2  = matchGoals.filter(g => g.team_id === match.team2_id);
    const cardsT1  = matchCards.filter(c => c.team_id === match.team1_id);
    const cardsT2  = matchCards.filter(c => c.team_id === match.team2_id);
    const hasGoals = matchGoals.length > 0;
    const hasCards = matchCards.length > 0;
    const hasDetails = hasGoals || hasCards;

    return (
      <div className="match-card match-summary-card">
        <div className="goals-assign-header">
          <h3>📊 Resumen del Partido</h3>
        </div>

        {/* ── Marcador central ── */}
        <div className="summary-scoreline">
          {/* Equipo 1 */}
          <div className="summary-team-block">
            <span className={`summary-team-name ${team1Wins ? 'match-winner' : ''}`}>
              {match.team1_name}
            </span>
          </div>

          {/* Score central */}
          <div className="summary-score-center">
            <div className="summary-score">
              <span className={team1Wins ? 'score-winner' : isDraw ? 'score-draw' : ''}>{match.score1}</span>
              <span className="match-vs">—</span>
              <span className={team2Wins ? 'score-winner' : isDraw ? 'score-draw' : ''}>{match.score2}</span>
            </div>
            <span className="summary-vs-label">resultado</span>
          </div>

          {/* Equipo 2 */}
          <div className="summary-team-block">
            <span className={`summary-team-name ${team2Wins ? 'match-winner' : ''}`}>
              {match.team2_name}
            </span>
          </div>
        </div>

        {/* ── Detalles en dos columnas por equipo ── */}
        {hasDetails ? (
          <div className="summary-details">
            {/* Columna equipo 1 */}
            <div className="summary-team-col">
              <div className="summary-team-col-header">{match.team1_name}</div>

              {hasGoals && (
                <>
                  <div className="summary-section-label">⚽ Goles</div>
                  {goalsT1.length > 0
                    ? goalsT1.map((g, i) => (
                        <div key={i} className="summary-event">⚽ {g.player_name}</div>
                      ))
                    : <div className="summary-event summary-event-empty">— Sin goles</div>
                  }
                </>
              )}

              {hasCards && (
                <>
                  <div className="summary-section-label">🟨 Tarjetas</div>
                  {cardsT1.length > 0
                    ? cardsT1.map((c, i) => (
                        <div key={i} className={`summary-event ${c.card_type === 'yellow' ? 'card-yellow' : 'card-blue'}`}>
                          {c.card_type === 'yellow' ? '🟨' : '🟦'} {c.player_name}
                        </div>
                      ))
                    : <div className="summary-event summary-event-empty">— Sin tarjetas</div>
                  }
                </>
              )}
            </div>

            {/* Columna equipo 2 */}
            <div className="summary-team-col">
              <div className="summary-team-col-header">{match.team2_name}</div>

              {hasGoals && (
                <>
                  <div className="summary-section-label">⚽ Goles</div>
                  {goalsT2.length > 0
                    ? goalsT2.map((g, i) => (
                        <div key={i} className="summary-event">⚽ {g.player_name}</div>
                      ))
                    : <div className="summary-event summary-event-empty">— Sin goles</div>
                  }
                </>
              )}

              {hasCards && (
                <>
                  <div className="summary-section-label">🟨 Tarjetas</div>
                  {cardsT2.length > 0
                    ? cardsT2.map((c, i) => (
                        <div key={i} className={`summary-event ${c.card_type === 'yellow' ? 'card-yellow' : 'card-blue'}`}>
                          {c.card_type === 'yellow' ? '🟨' : '🟦'} {c.player_name}
                        </div>
                      ))
                    : <div className="summary-event summary-event-empty">— Sin tarjetas</div>
                  }
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="summary-empty">No se registraron detalles para este partido</p>
        )}

        <div className="btn-center" style={{ marginTop: '18px' }}>
          <button className="btn btn-danger" onClick={() => setShowSummary(false)}>
            ✕ Cerrar
          </button>
        </div>
      </div>
    );
  }

  // ── VISTA NORMAL DEL PARTIDO ──
  return (
    <div className={`match-card ${match.completed ? 'match-completed' : ''}`}>
      <div className="match-teams">
        {/* Equipo 1 — arriba */}
        <span className={`match-team match-team-top ${team1Wins ? 'match-winner' : ''}`}>
          {match.team1_name}
        </span>

        {/* Marcador o inputs — centro */}
        {match.completed && !editing ? (
          <div className="match-score-display">
            <span className={`match-score ${team1Wins ? 'score-winner' : isDraw ? 'score-draw' : ''}`}>
              {match.score1}
            </span>
            <span className="match-vs">—</span>
            <span className={`match-score ${team2Wins ? 'score-winner' : isDraw ? 'score-draw' : ''}`}>
              {match.score2}
            </span>
          </div>
        ) : isAdmin && (!match.completed || editing) ? (
          <div className="match-score-inputs">
            <input
              type="number"
              min="0"
              value={score1}
              onChange={e => setScore1(parseInt(e.target.value) || 0)}
              className="score-input"
            />
            <span className="match-vs">vs</span>
            <input
              type="number"
              min="0"
              value={score2}
              onChange={e => setScore2(parseInt(e.target.value) || 0)}
              className="score-input"
            />
          </div>
        ) : (
          <div className="match-score-display">
            <span className="match-vs">vs</span>
          </div>
        )}

        {/* Equipo 2 — abajo */}
        <span className={`match-team match-team-bottom ${team2Wins ? 'match-winner' : ''}`}>
          {match.team2_name}
        </span>
      </div>

      <div className="match-footer">
        {match.completed && !editing ? (
          <>
            <span className="badge badge-success">✅ Finalizado</span>
            <button
              className="btn btn-info"
              style={{ padding: '4px 14px', fontSize: '0.8em' }}
              onClick={() => setShowSummary(true)}
            >
              📊 Resumen
            </button>
            {isAdmin && (
              <button
                className="btn btn-warning"
                style={{ padding: '4px 14px', fontSize: '0.8em' }}
                onClick={() => {
                  setScore1(match.score1);
                  setScore2(match.score2);
                  // Precargar tarjetas existentes para que no se pierdan si no se toca ese paso
                  const existingCards = (match.cards || []).map(c => ({
                    team_id:     c.team_id,
                    team_name:   c.team_id === match.team1_id ? match.team1_name : match.team2_name,
                    player_name: c.player_name || '',
                    card_type:   c.card_type || 'yellow',
                  }));
                  setCards(existingCards);
                  setEditing(true);
                }}
              >
                ✏️ Editar
              </button>
            )}
          </>
        ) : isAdmin ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '6px 20px', fontSize: '0.9em' }}
              onClick={handleNextStep}
            >
              ✔ Registrar {scoreLabel}
            </button>
            {editing && (
              <button
                className="btn btn-danger"
                style={{ padding: '6px 14px', fontSize: '0.9em' }}
                onClick={() => setEditing(false)}
              >
                ✕ Cancelar
              </button>
            )}
          </div>
        ) : (
          <span className="badge badge-info">🕐 Esperando resultados</span>
        )}
      </div>
    </div>
  );
}