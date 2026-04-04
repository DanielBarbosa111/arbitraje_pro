// =====================================================
// Arbitraje Pro — Rutas de Fase 2 (Bracket Eliminatorio)
// =====================================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Generar bracket con los 8 clasificados de un subtorneo
router.post('/generate', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { subtorneo_id, clasificados } = req.body;

    if (!subtorneo_id) return res.status(400).json({ error: 'subtorneo_id requerido' });
    if (!clasificados || clasificados.length !== 8)
      return res.status(400).json({ error: 'Se necesitan exactamente 8 equipos clasificados' });

    await conn.query('DELETE FROM fase2_matches WHERE subtorneo_id = ?', [subtorneo_id]);
    await conn.beginTransaction();

    for (let i = 0; i < 4; i++) {
      await conn.query(
        'INSERT INTO fase2_matches (subtorneo_id, bracket_position, round, team1_id, team2_id) VALUES (?,?,?,?,?)',
        [subtorneo_id, i, 'cuartos', clasificados[i * 2], clasificados[i * 2 + 1]]
      );
    }

    for (let i = 4; i <= 5; i++) {
      await conn.query(
        'INSERT INTO fase2_matches (subtorneo_id, bracket_position, round, team1_id, team2_id) VALUES (?,?,?,?,?)',
        [subtorneo_id, i, 'semis', null, null]
      );
    }

    await conn.query(
      'INSERT INTO fase2_matches (subtorneo_id, bracket_position, round, team1_id, team2_id) VALUES (?,?,?,?,?)',
      [subtorneo_id, 6, 'final', null, null]
    );

    await conn.query(
      "UPDATE subtorneos SET status = 'fase2' WHERE id = ?", [subtorneo_id]
    );

    await conn.commit();
    res.json({ generated: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Listar partidos del bracket de un subtorneo (con goles y tarjetas)
router.get('/matches', async (req, res) => {
  try {
    const sid = req.query.subtorneo_id;
    if (!sid) return res.status(400).json({ error: 'subtorneo_id requerido' });

    const [rows] = await db.query(`
      SELECT fm.id, fm.bracket_position, fm.round,
             fm.team1_id, t1.name AS team1_name,
             fm.team2_id, t2.name AS team2_name,
             fm.score1, fm.score2,
             fm.winner_team_id, fm.completed,
             fm.subtorneo_id
      FROM fase2_matches fm
      LEFT JOIN teams t1 ON t1.id = fm.team1_id
      LEFT JOIN teams t2 ON t2.id = fm.team2_id
      WHERE fm.subtorneo_id = ?
      ORDER BY fm.bracket_position
    `, [sid]);

    for (const match of rows) {
      const [goals] = await db.query(
        'SELECT id, team_id, player_name FROM fase2_goals WHERE match_id = ? ORDER BY id',
        [match.id]
      );
      match.goals = goals;

      const [cards] = await db.query(
        'SELECT id, team_id, player_name, card_type FROM fase2_cards WHERE match_id = ? ORDER BY id',
        [match.id]
      );
      match.cards = cards;
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar resultado con goles, tarjetas y avanzar ganador
router.post('/save-result', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { match_id, score1, score2, winner_team_id, goals, cards } = req.body;

    if (!match_id || !winner_team_id)
      return res.status(400).json({ error: 'Datos incompletos' });

    const [matchRows] = await conn.query(
      'SELECT * FROM fase2_matches WHERE id = ?', [match_id]
    );
    if (!matchRows.length) return res.status(404).json({ error: 'Partido no encontrado' });

    const match = matchRows[0];
    const pos   = match.bracket_position;
    const sid   = match.subtorneo_id;

    await conn.beginTransaction();

    await conn.query(
      'UPDATE fase2_matches SET score1=?, score2=?, winner_team_id=?, completed=1 WHERE id=?',
      [score1 || 0, score2 || 0, winner_team_id, match_id]
    );

    // Borrar goles y tarjetas anteriores
    await conn.query('DELETE FROM fase2_goals WHERE match_id = ?', [match_id]);
    await conn.query('DELETE FROM fase2_cards WHERE match_id = ?', [match_id]);

    // Guardar goles
    if (goals && Array.isArray(goals) && goals.length > 0) {
      for (const g of goals) {
        if (g.player_name && g.player_name.trim() && g.team_id) {
          await conn.query(
            'INSERT INTO fase2_goals (match_id, team_id, player_name) VALUES (?,?,?)',
            [match_id, g.team_id, g.player_name.trim()]
          );
        }
      }
    }

    // Guardar tarjetas
    if (cards && Array.isArray(cards) && cards.length > 0) {
      for (const c of cards) {
        if (c.player_name && c.player_name.trim() && c.team_id && c.card_type) {
          await conn.query(
            'INSERT INTO fase2_cards (match_id, team_id, player_name, card_type) VALUES (?,?,?,?)',
            [match_id, c.team_id, c.player_name.trim(), c.card_type]
          );
        }
      }
    }

    // Avanzar ganador a la siguiente ronda
    let nextPos = null, nextSide = null;

    if (pos >= 0 && pos <= 3) {
      nextPos  = 4 + Math.floor(pos / 2);
      nextSide = (pos % 2 === 0) ? 1 : 2;
    } else if (pos >= 4 && pos <= 5) {
      nextPos  = 6;
      nextSide = (pos === 4) ? 1 : 2;
    }

    if (nextPos !== null) {
      const col = (nextSide === 1) ? 'team1_id' : 'team2_id';
      await conn.query(
        `UPDATE fase2_matches SET ${col}=? WHERE subtorneo_id=? AND bracket_position=?`,
        [winner_team_id, sid, nextPos]
      );
    } else {
      await conn.query(
        "UPDATE subtorneos SET status='finished' WHERE id=?", [sid]
      );

      const [pending] = await conn.query(`
        SELECT COUNT(*) AS pending FROM subtorneos
        WHERE tournament_id = (SELECT tournament_id FROM subtorneos WHERE id = ?)
        AND status != 'finished'
      `, [sid]);

      if (pending[0].pending === 0) {
        await conn.query(`
          UPDATE tournaments SET status='finished'
          WHERE id = (SELECT tournament_id FROM subtorneos WHERE id = ?)
        `, [sid]);
      }
    }

    await conn.commit();
    res.json({ saved: true, winner_team_id });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;