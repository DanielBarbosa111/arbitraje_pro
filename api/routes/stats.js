// =====================================================
// Arbitraje Pro — Rutas de Estadísticas (Completas v3)
// FIX: JOIN cartesiano en /general que multiplicaba goles
// FIX: topTeams/bestDefenses/mostVictories sin restricción de jornada
// =====================================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── Estadísticas de un subtorneo ───────────────────────────────────────────
router.get('/subtorneo', async (req, res) => {
  try {
    const sid = req.query.subtorneo_id;
    if (!sid) return res.status(400).json({ error: 'subtorneo_id requerido' });

    // Fase 1 totales — subquery explícita para evitar multiplicación por JOINs
    const [f1] = await db.query(`
      SELECT COALESCE(SUM(score1 + score2), 0) AS total_goals,
             COUNT(CASE WHEN completed = 1 THEN 1 END) AS matches_played,
             COUNT(*) AS total_matches
      FROM fase1_matches
      WHERE jornada_id IN (
        SELECT id FROM jornadas WHERE subtorneo_id = ?
      )
    `, [sid]);

    // Fase 2 totales
    const [f2] = await db.query(`
      SELECT COALESCE(SUM(fm.score1 + fm.score2), 0) AS total_goals,
             COUNT(CASE WHEN fm.completed = 1 THEN 1 END) AS matches_played,
             COUNT(*) AS total_matches
      FROM fase2_matches fm
      WHERE fm.subtorneo_id = ?
    `, [sid]);

    // Goleadores individuales
    const [topScorers] = await db.query(`
      SELECT fg.player_name, t.name AS team_name, COUNT(*) AS goals
      FROM fase1_goals fg
      INNER JOIN teams t ON t.id = fg.team_id
      WHERE fg.match_id IN (
        SELECT fm.id FROM fase1_matches fm
        WHERE fm.jornada_id IN (SELECT id FROM jornadas WHERE subtorneo_id = ?)
      )
      GROUP BY fg.player_name, fg.team_id
      ORDER BY goals DESC
      LIMIT 10
    `, [sid]);

    // FIX: Equipos más goleadores — INNER JOIN en jornadas restringe al subtorneo;
    // el LEFT JOIN ya filtra por jornada del equipo, evitando conteo cruzado
    const [topTeams] = await db.query(`
      SELECT t.name, t.id,
             COALESCE(SUM(CASE WHEN fm.team1_id = t.id THEN fm.score1
                               WHEN fm.team2_id = t.id THEN fm.score2
                               ELSE 0 END), 0) AS goals
      FROM teams t
      INNER JOIN jornadas j ON j.id = t.jornada_id AND j.subtorneo_id = ?
      LEFT JOIN fase1_matches fm ON (fm.team1_id = t.id OR fm.team2_id = t.id)
                                 AND fm.completed = 1
                                 AND fm.jornada_id = t.jornada_id
      GROUP BY t.id
      HAVING goals > 0
      ORDER BY goals DESC
      LIMIT 10
    `, [sid]);

    // FIX: Mejores defensas — misma corrección de JOIN
    const [bestDefenses] = await db.query(`
      SELECT t.name, t.id,
             COALESCE(SUM(CASE WHEN fm.team1_id = t.id THEN fm.score2
                               WHEN fm.team2_id = t.id THEN fm.score1
                               ELSE 0 END), 0) AS conceded
      FROM teams t
      INNER JOIN jornadas j ON j.id = t.jornada_id AND j.subtorneo_id = ?
      LEFT JOIN fase1_matches fm ON (fm.team1_id = t.id OR fm.team2_id = t.id)
                                 AND fm.completed = 1
                                 AND fm.jornada_id = t.jornada_id
      GROUP BY t.id
      ORDER BY conceded ASC
      LIMIT 10
    `, [sid]);

    // FIX: Equipos con más victorias — misma corrección de JOIN
    const [mostVictories] = await db.query(`
      SELECT t.name, t.id,
             COALESCE(SUM(CASE
               WHEN fm.team1_id = t.id AND fm.score1 > fm.score2 THEN 1
               WHEN fm.team2_id = t.id AND fm.score2 > fm.score1 THEN 1
               ELSE 0 END), 0) AS wins
      FROM teams t
      INNER JOIN jornadas j ON j.id = t.jornada_id AND j.subtorneo_id = ?
      LEFT JOIN fase1_matches fm ON (fm.team1_id = t.id OR fm.team2_id = t.id)
                                 AND fm.completed = 1
                                 AND fm.jornada_id = t.jornada_id
      GROUP BY t.id
      HAVING wins > 0
      ORDER BY wins DESC
      LIMIT 10
    `, [sid]);

    // Partidos destacados (más goles)
    const [highlightedMatches] = await db.query(`
      SELECT fm.id, fm.score1, fm.score2,
             t1.name AS team1_name, t2.name AS team2_name,
             (fm.score1 + fm.score2) AS total_goals,
             CASE WHEN fm.score1 > fm.score2 THEN 1
                  WHEN fm.score2 > fm.score1 THEN 2 ELSE 0 END AS winner
      FROM fase1_matches fm
      INNER JOIN teams t1 ON t1.id = fm.team1_id
      INNER JOIN teams t2 ON t2.id = fm.team2_id
      WHERE fm.completed = 1
        AND fm.jornada_id IN (SELECT id FROM jornadas WHERE subtorneo_id = ?)
      ORDER BY total_goals DESC
      LIMIT 5
    `, [sid]);

    // Tarjetas por jugador
    let topCardsPlayers = [];
    try {
      const [rows] = await db.query(`
        SELECT fc.player_name, t.name AS team_name,
               SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) AS yellow_cards,
               SUM(CASE WHEN fc.card_type = 'blue'   THEN 1 ELSE 0 END) AS blue_cards
        FROM fase1_cards fc
        INNER JOIN teams t ON t.id = fc.team_id
        WHERE fc.match_id IN (
          SELECT fm.id FROM fase1_matches fm
          WHERE fm.jornada_id IN (SELECT id FROM jornadas WHERE subtorneo_id = ?)
        )
        GROUP BY fc.player_name, fc.team_id
        HAVING (SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) + SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END)) > 0
        ORDER BY (SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) + SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END)) DESC,
        SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END) DESC
        LIMIT 10
      `, [sid]);
      topCardsPlayers = rows;
    } catch (e) {
      console.warn('fase1_cards (subtorneo jugadores):', e.message);
    }

    // Tarjetas por equipo
    let topCardsTeams = [];
    try {
      const [rows] = await db.query(`
        SELECT t.name, t.id,
               SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) AS yellow_cards,
               SUM(CASE WHEN fc.card_type = 'blue'   THEN 1 ELSE 0 END) AS blue_cards
        FROM fase1_cards fc
        INNER JOIN teams t ON t.id = fc.team_id
        WHERE fc.match_id IN (
          SELECT fm.id FROM fase1_matches fm
          WHERE fm.jornada_id IN (SELECT id FROM jornadas WHERE subtorneo_id = ?)
        )
        GROUP BY t.id
        HAVING (SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) + SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END)) > 0
        ORDER BY (SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) + SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END)) DESC,
        SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END) DESC
        LIMIT 10
      `, [sid]);
      topCardsTeams = rows;
    } catch (e) {
      console.warn('fase1_cards (subtorneo equipos):', e.message);
    }

    // Equipos y jugadores del subtorneo
    const [[countsRow]] = await db.query(`
      SELECT COUNT(DISTINCT t.id) AS total_teams,
             COUNT(DISTINCT p.id) AS total_players
      FROM teams t
      INNER JOIN jornadas j ON j.id = t.jornada_id AND j.subtorneo_id = ?
      LEFT JOIN players p ON p.team_id = t.id
    `, [sid]);

    const totalGoals   = f1[0].total_goals + f2[0].total_goals;
    const totalPlayed  = f1[0].matches_played + f2[0].matches_played;
    const totalMatches = f1[0].total_matches + f2[0].total_matches;
    const avgGoals     = totalPlayed > 0 ? Math.round((totalGoals / totalPlayed) * 10) / 10 : 0;

    res.json({
      total_goals:          totalGoals,
      matches_played:       totalPlayed,
      total_matches:        totalMatches,
      avg_goals:            avgGoals,
      total_teams:          countsRow.total_teams,
      total_players:        countsRow.total_players,
      top_scorers:          topScorers,
      top_teams:            topTeams,
      best_defenses:        bestDefenses,
      most_victories:       mostVictories,
      highlighted_matches:  highlightedMatches,
      top_cards_players:    topCardsPlayers,
      top_cards_teams:      topCardsTeams,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Estadísticas generales del torneo ─────────────────────────────────────
router.get('/general', async (req, res) => {
  try {
    const tid = req.query.tournament_id;
    if (!tid) return res.status(400).json({ error: 'tournament_id requerido' });

    // FIX: Fase 1 totales — subquery en lugar de JOINs para evitar
    // multiplicación cartesiana (N jornadas x M equipos x partidos = cifras infladas)
    const [f1] = await db.query(`
      SELECT COALESCE(SUM(score1 + score2), 0) AS total_goals,
             COUNT(CASE WHEN completed = 1 THEN 1 END) AS matches_played,
             COUNT(*) AS total_matches
      FROM fase1_matches
      WHERE jornada_id IN (
        SELECT j.id FROM jornadas j
        INNER JOIN subtorneos s ON s.id = j.subtorneo_id
        WHERE s.tournament_id = ?
      )
    `, [tid]);

    // Fase 2 totales
    const [f2] = await db.query(`
      SELECT COALESCE(SUM(fm.score1 + fm.score2), 0) AS total_goals,
             COUNT(CASE WHEN fm.completed = 1 THEN 1 END) AS matches_played,
             COUNT(*) AS total_matches
      FROM fase2_matches fm
      INNER JOIN subtorneos s ON s.id = fm.subtorneo_id
      WHERE s.tournament_id = ?
    `, [tid]);

    // Goleadores generales
    const [topScorers] = await db.query(`
      SELECT fg.player_name, t.name AS team_name, COUNT(*) AS goals
      FROM fase1_goals fg
      INNER JOIN teams t ON t.id = fg.team_id
      INNER JOIN fase1_matches fm ON fm.id = fg.match_id
      INNER JOIN jornadas j ON j.id = fm.jornada_id
      INNER JOIN subtorneos s ON s.id = j.subtorneo_id
      WHERE s.tournament_id = ?
      GROUP BY fg.player_name, fg.team_id
      ORDER BY goals DESC
      LIMIT 10
    `, [tid]);

    // FIX: Equipos más goleadores — subquery correlacionada en lugar de
    // LEFT JOIN sin restricción (causaba multiplicación: mismo partido
    // contado N veces por el cruce con jornadas del torneo)
    const [topTeams] = await db.query(`
      SELECT t.name, t.id,
             COALESCE((
               SELECT SUM(CASE WHEN fm2.team1_id = t.id THEN fm2.score1
                               WHEN fm2.team2_id = t.id THEN fm2.score2
                               ELSE 0 END)
               FROM fase1_matches fm2
               WHERE (fm2.team1_id = t.id OR fm2.team2_id = t.id)
                 AND fm2.completed = 1
                 AND fm2.jornada_id = t.jornada_id
             ), 0) AS goals
      FROM teams t
      INNER JOIN jornadas j ON j.id = t.jornada_id
      INNER JOIN subtorneos s ON s.id = j.subtorneo_id
      WHERE s.tournament_id = ?
      HAVING goals > 0
      ORDER BY goals DESC
      LIMIT 10
    `, [tid]);

    // FIX: Mejores defensas — misma corrección con subquery correlacionada
    const [bestDefenses] = await db.query(`
      SELECT t.name, t.id,
             COALESCE((
               SELECT SUM(CASE WHEN fm2.team1_id = t.id THEN fm2.score2
                               WHEN fm2.team2_id = t.id THEN fm2.score1
                               ELSE 0 END)
               FROM fase1_matches fm2
               WHERE (fm2.team1_id = t.id OR fm2.team2_id = t.id)
                 AND fm2.completed = 1
                 AND fm2.jornada_id = t.jornada_id
             ), 0) AS conceded
      FROM teams t
      INNER JOIN jornadas j ON j.id = t.jornada_id
      INNER JOIN subtorneos s ON s.id = j.subtorneo_id
      WHERE s.tournament_id = ?
      ORDER BY conceded ASC
      LIMIT 10
    `, [tid]);

    // FIX: Más victorias — misma corrección con subquery correlacionada
    const [mostVictories] = await db.query(`
      SELECT t.name, t.id,
             COALESCE((
               SELECT SUM(CASE
                 WHEN fm2.team1_id = t.id AND fm2.score1 > fm2.score2 THEN 1
                 WHEN fm2.team2_id = t.id AND fm2.score2 > fm2.score1 THEN 1
                 ELSE 0 END)
               FROM fase1_matches fm2
               WHERE (fm2.team1_id = t.id OR fm2.team2_id = t.id)
                 AND fm2.completed = 1
                 AND fm2.jornada_id = t.jornada_id
             ), 0) AS wins
      FROM teams t
      INNER JOIN jornadas j ON j.id = t.jornada_id
      INNER JOIN subtorneos s ON s.id = j.subtorneo_id
      WHERE s.tournament_id = ?
      HAVING wins > 0
      ORDER BY wins DESC
      LIMIT 10
    `, [tid]);

    // Partidos destacados
    const [highlightedMatches] = await db.query(`
      SELECT fm.id, fm.score1, fm.score2,
             t1.name AS team1_name, t2.name AS team2_name,
             (fm.score1 + fm.score2) AS total_goals,
             CASE WHEN fm.score1 > fm.score2 THEN 1
                  WHEN fm.score2 > fm.score1 THEN 2 ELSE 0 END AS winner
      FROM fase1_matches fm
      INNER JOIN teams t1 ON t1.id = fm.team1_id
      INNER JOIN teams t2 ON t2.id = fm.team2_id
      INNER JOIN jornadas j ON j.id = fm.jornada_id
      INNER JOIN subtorneos s ON s.id = j.subtorneo_id
      WHERE s.tournament_id = ? AND fm.completed = 1
      ORDER BY total_goals DESC
      LIMIT 5
    `, [tid]);

    // Subtorneos
    const [subtorneos] = await db.query(`
      SELECT s.id, s.name, s.type, s.status FROM subtorneos s
      WHERE s.tournament_id = ? ORDER BY s.id
    `, [tid]);

    // Tarjetas por jugador (general)
    let topCardsPlayers = null;
    try {
      const [rows] = await db.query(`
        SELECT fc.player_name, t.name AS team_name,
               SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) AS yellow_cards,
               SUM(CASE WHEN fc.card_type = 'blue'   THEN 1 ELSE 0 END) AS blue_cards
        FROM fase1_cards fc
        INNER JOIN teams t ON t.id = fc.team_id
        INNER JOIN fase1_matches fm ON fm.id = fc.match_id
        INNER JOIN jornadas j ON j.id = fm.jornada_id
        INNER JOIN subtorneos s ON s.id = j.subtorneo_id
        WHERE s.tournament_id = ?
        GROUP BY fc.player_name, fc.team_id
        ORDER BY (SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) + SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END)) DESC,
        SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END) DESC
        LIMIT 10
      `, [tid]);
      topCardsPlayers = rows;
    } catch (_) {}

    // Tarjetas por equipo (general)
    let topCardsTeams = null;
    try {
      const [rows] = await db.query(`
        SELECT t.name, t.id,
               SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) AS yellow_cards,
               SUM(CASE WHEN fc.card_type = 'blue'   THEN 1 ELSE 0 END) AS blue_cards
        FROM fase1_cards fc
        INNER JOIN teams t ON t.id = fc.team_id
        INNER JOIN fase1_matches fm ON fm.id = fc.match_id
        INNER JOIN jornadas j ON j.id = fm.jornada_id
        INNER JOIN subtorneos s ON s.id = j.subtorneo_id
        WHERE s.tournament_id = ?
        GROUP BY t.id
        HAVING (SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) + SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END)) > 0
        ORDER BY (SUM(CASE WHEN fc.card_type = 'yellow' THEN 1 ELSE 0 END) + SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END)) DESC,
        SUM(CASE WHEN fc.card_type = 'blue' THEN 1 ELSE 0 END) DESC
        LIMIT 10
      `, [tid]);
      topCardsTeams = rows;
    } catch (_) {}

    // Equipos y jugadores del subtorneo
    const [[countsRow]] = await db.query(`
      SELECT COUNT(DISTINCT t.id) AS total_teams,
             COUNT(DISTINCT p.id) AS total_players
      FROM teams t
      INNER JOIN jornadas j ON j.id = t.jornada_id AND j.subtorneo_id = ?
      LEFT JOIN players p ON p.team_id = t.id
    `, [sid]);

    const totalGoals   = f1[0].total_goals + f2[0].total_goals;
    const totalPlayed  = f1[0].matches_played + f2[0].matches_played;
    const totalMatches = f1[0].total_matches + f2[0].total_matches;
    const avgGoals     = totalPlayed > 0 ? Math.round((totalGoals / totalPlayed) * 10) / 10 : 0;

    res.json({
      total_goals:          totalGoals,
      matches_played:       totalPlayed,
      total_matches:        totalMatches,
      avg_goals:            avgGoals,
      total_teams:          countsRow.total_teams,
      total_players:        countsRow.total_players,
      top_scorers:          topScorers,
      top_teams:            topTeams,
      best_defenses:        bestDefenses,
      most_victories:       mostVictories,
      highlighted_matches:  highlightedMatches,
      subtorneos,
      top_cards_players:    topCardsPlayers,
      top_cards_teams:      topCardsTeams,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;