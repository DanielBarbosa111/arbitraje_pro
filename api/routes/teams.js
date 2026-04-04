// =====================================================
// Arbitraje Pro — Rutas de Equipos
// =====================================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Listar equipos de una jornada o subtorneo (con jugadores)
router.get('/list', async (req, res) => {
  try {
    const jid = req.query.jornada_id;
    const sid = req.query.subtorneo_id;

    if (!jid && !sid)
      return res.status(400).json({ error: 'jornada_id o subtorneo_id requerido' });

    let teams;
    if (jid) {
      [teams] = await db.query(
        'SELECT id, name, jornada_id FROM teams WHERE jornada_id = ? ORDER BY name',
        [jid]
      );
    } else {
      // Traer todos los equipos de todas las jornadas del subtorneo
      [teams] = await db.query(
        `SELECT t.id, t.name, t.jornada_id
         FROM teams t
         INNER JOIN jornadas j ON j.id = t.jornada_id
         WHERE j.subtorneo_id = ?
         ORDER BY t.name`,
        [sid]
      );
    }

    for (const team of teams) {
      const [players] = await db.query(
        'SELECT id, name FROM players WHERE team_id = ? ORDER BY id',
        [team.id]
      );
      team.players = players;
    }

    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar equipo con jugadores
router.post('/add', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { jornada_id, name, players } = req.body;

    if (!jornada_id || !name || !players || players.length < 1)
      return res.status(400).json({ error: 'Datos incompletos' });

    // Verificar que la jornada existe y el subtorneo está en setup
    const [check] = await conn.query(`
      SELECT j.id, s.status, s.type FROM jornadas j
      INNER JOIN subtorneos s ON s.id = j.subtorneo_id
      WHERE j.id = ?
    `, [jornada_id]);

    if (!check.length) return res.status(404).json({ error: 'Jornada no encontrada' });
    if (check[0].status !== 'setup') return res.status(400).json({ error: 'El subtorneo ya fue iniciado' });

    // Tenis de mesa: mínimo 1 jugador. Los demás: mínimo 5
    const minPlayers = check[0].type === 'tenis' ? 1 : 5;
    if (players.length < minPlayers)
      return res.status(400).json({ error: `Se necesitan al menos ${minPlayers} jugadores` });

    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO teams (jornada_id, name) VALUES (?,?)',
      [jornada_id, name.trim()]
    );
    const teamId = result.insertId;

    for (const pName of players) {
      const trimmed = pName.trim();
      if (trimmed) {
        await conn.query(
          'INSERT INTO players (team_id, name) VALUES (?,?)',
          [teamId, trimmed]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ team_id: teamId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Eliminar equipo
router.post('/remove', async (req, res) => {
  try {
    const { team_id } = req.body;
    if (!team_id) return res.status(400).json({ error: 'team_id requerido' });

    await db.query('DELETE FROM teams WHERE id = ?', [team_id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Renombrar equipo
router.put('/rename', async (req, res) => {
  try {
    const { team_id, name } = req.body;
    if (!team_id || !name || !name.trim())
      return res.status(400).json({ error: 'team_id y name requeridos' });

    await db.query('UPDATE teams SET name = ? WHERE id = ?', [name.trim(), team_id]);
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Renombrar jugador
router.put('/player/rename', async (req, res) => {
  try {
    const { player_id, name } = req.body;
    if (!player_id || !name || !name.trim())
      return res.status(400).json({ error: 'player_id y name requeridos' });

    await db.query('UPDATE players SET name = ? WHERE id = ?', [name.trim(), player_id]);
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar jugador
router.delete('/player/remove', async (req, res) => {
  try {
    const { player_id } = req.body;
    if (!player_id) return res.status(400).json({ error: 'player_id requerido' });

    await db.query('DELETE FROM players WHERE id = ?', [player_id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;