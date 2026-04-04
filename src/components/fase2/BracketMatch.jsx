// =====================================================
// Arbitraje Pro — Partido del Bracket
// Delega toda la UI a MatchResultForm (idéntico a fase de grupos)
// La única diferencia: al guardar también determina el winner_team_id
// =====================================================

import MatchResultForm from '../fase1/MatchResultForm';

export default function BracketMatch({ match, isAdmin, scoreLabel, onSave, isFinal, subtorneoType }) {

  // MatchResultForm llama onSave(matchId, score1, score2, goals, cards)
  // Nosotros necesitamos también winner_team_id → lo deducimos del marcador
  function handleSave(matchId, score1, score2, goals, cards) {
    let winnerId;
    if (score1 > score2) {
      winnerId = match.team1_id;
    } else if (score2 > score1) {
      winnerId = match.team2_id;
    } else {
      // Empate no debería ocurrir en eliminatorias, pero si pasa
      // dejamos que el admin elija — por ahora usamos el primero
      winnerId = match.team1_id;
    }
    onSave(matchId, score1, score2, winnerId, goals, cards);
  }

  return (
    <MatchResultForm
      match={match}
      scoreLabel={scoreLabel}
      isAdmin={isAdmin}
      onSave={handleSave}
      subtorneoType={subtorneoType}
    />
  );
}