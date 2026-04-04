// =====================================================
// Arbitraje Pro — Rutas de Jornadas
// =====================================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Listar subtorneos de un torneo (con sus jornadas)
router.get('/subtorneos', async (req, res) => {
  try {
    const tid = req.query.tournament_id;
    if (!tid) return res.status(400).json({ error: 'tournament_id requerido' });

    const [rows] = await db.query(`
      SELECT s.*,
             (SELECT COUNT(*) FROM teams t
              INNER JOIN jornadas j ON j.id = t.jornada_id
              WHERE j.subtorneo_id = s.id) AS teams_count
      FROM subtorneos s
      WHERE s.tournament_id = ?
      ORDER BY s.id
    `, [tid]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar jornadas de un subtorneo
router.get('/list', async (req, res) => {
  try {
    const sid = req.query.subtorneo_id;
    if (!sid) return res.status(400).json({ error: 'subtorneo_id requerido' });

    const [rows] = await db.query(`
      SELECT j.*,
             COUNT(DISTINCT t.id) AS teams_count
      FROM jornadas j
      LEFT JOIN teams t ON t.jornada_id = j.id
      WHERE j.subtorneo_id = ?
      GROUP BY j.id
      ORDER BY j.id
    `, [sid]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;