// =====================================================
// Arbitraje Pro — Vista del Bracket (top → down)
// =====================================================

import BracketMatch from './BracketMatch';

export default function BracketView({ cuartos, semis, final_, isAdmin, currentSubtorneo, onSaveResult }) {

  const scoreLabel = currentSubtorneo?.type === 'banquitas_m' || currentSubtorneo?.type === 'banquitas_f'
    ? 'Goles' : 'Sets';

  return (
    <div className="bracket-tree">

      {/* ── CUARTOS DE FINAL ── */}
      <div className="bracket-level">
        <div className="bracket-level-title">Cuartos de Final</div>
        <div className="bracket-level-matches bracket-level-4">
          {cuartos.map(m => (
            <div key={m.id} className="bracket-cell">
              <BracketMatch
                match={m}
                isAdmin={isAdmin}
                scoreLabel={scoreLabel}
                onSave={onSaveResult}
                subtorneoType={currentSubtorneo?.type}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Conectores cuartos → semis */}
      <div className="bracket-connectors bracket-connectors-4to2">
        <div className="connector-pair">
          <div className="connector-line connector-left" />
          <div className="connector-line connector-right" />
          <div className="connector-h-bar" />
          <div className="connector-drop" />
        </div>
        <div className="connector-pair">
          <div className="connector-line connector-left" />
          <div className="connector-line connector-right" />
          <div className="connector-h-bar" />
          <div className="connector-drop" />
        </div>
      </div>

      {/* ── SEMIFINALES ── */}
      <div className="bracket-level">
        <div className="bracket-level-title">Semifinales</div>
        <div className="bracket-level-matches bracket-level-2">
          {semis.map(m => (
            <div key={m.id} className="bracket-cell">
              <BracketMatch
                match={m}
                isAdmin={isAdmin}
                scoreLabel={scoreLabel}
                onSave={onSaveResult}
                subtorneoType={currentSubtorneo?.type}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Conectores semis → final */}
      <div className="bracket-connectors bracket-connectors-2to1">
        <div className="connector-pair connector-pair-wide">
          <div className="connector-line connector-left" />
          <div className="connector-line connector-right" />
          <div className="connector-h-bar" />
          <div className="connector-drop" />
        </div>
      </div>

      {/* ── FINAL ── */}
      <div className="bracket-level bracket-level-final">
        <div className="bracket-level-title">⭐ Final</div>
        <div className="bracket-level-matches bracket-level-1">
          {final_.map(m => (
            <div key={m.id} className="bracket-cell bracket-cell-final">
              <BracketMatch
                match={m}
                isAdmin={isAdmin}
                scoreLabel={scoreLabel}
                onSave={onSaveResult}
                subtorneoType={currentSubtorneo?.type}
                isFinal
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}