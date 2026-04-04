// =====================================================
// Arbitraje Pro — Rutas de Torneos
// =====================================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Listar todos los torneos
router.get('/list', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.id, t.name, t.status, t.created_at,
             COALESCE(t.visible, 1) AS visible,
             COUNT(DISTINCT s.id) AS subtorneos_count
      FROM tournaments t
      LEFT JOIN subtorneos s ON s.tournament_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear torneo (con 4 subtorneos y 5 jornadas cada uno)
router.post('/create', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre requerido' });

    await conn.beginTransaction();

    const [result] = await conn.query(
      "INSERT INTO tournaments (name, status) VALUES (?, 'setup')",
      [name.trim()]
    );
    const tid = result.insertId;

    // 4 subtorneos fijos
    const subtorneos = [
      ['Banquitas Masculino',     'banquitas_m'],
      ['Banquitas Femenino',      'banquitas_f'],
      ['Voleibol Mixto',          'voleibol'],
      ['Tenis de Mesa Individual','tenis'],
    ];

    // 5 jornadas fijas por subtorneo
    const jornadas = [
      ['Jornada Mañana',               2],
      ['Jornada Tarde',                 2],
      ['Jornada Noche',                 2],
      ['Jornada Fin de Semana Mañana',  1],
      ['Jornada Fin de Semana Tarde',   1],
    ];

    for (const [sName, sType] of subtorneos) {
      const [sResult] = await conn.query(
        "INSERT INTO subtorneos (tournament_id, name, type, status) VALUES (?,?,?,'setup')",
        [tid, sName, sType]
      );
      const sid = sResult.insertId;

      for (const [jName, cupos] of jornadas) {
        await conn.query(
          'INSERT INTO jornadas (subtorneo_id, name, cupos_base) VALUES (?,?,?)',
          [sid, jName, cupos]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ tournament_id: tid });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Renombrar torneo
router.post('/rename', async (req, res) => {
  try {
    const { tournament_id, name } = req.body;
    if (!tournament_id || !name || !name.trim())
      return res.status(400).json({ error: 'tournament_id y nombre requeridos' });
    await db.query('UPDATE tournaments SET name = ? WHERE id = ?', [name.trim(), tournament_id]);
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cambiar visibilidad del torneo
router.post('/toggle-visible', async (req, res) => {
  try {
    const { tournament_id } = req.body;
    if (!tournament_id) return res.status(400).json({ error: 'tournament_id requerido' });
    // Si la columna visible no existe aún, la creamos en el primer uso
    try {
      await db.query('ALTER TABLE tournaments ADD COLUMN visible tinyint(1) NOT NULL DEFAULT 1');
    } catch (_) { /* columna ya existe */ }
    await db.query(
      'UPDATE tournaments SET visible = NOT visible WHERE id = ?',
      [tournament_id]
    );
    const [[row]] = await db.query('SELECT visible FROM tournaments WHERE id = ?', [tournament_id]);
    res.json({ visible: row.visible });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar torneo
router.post('/delete', async (req, res) => {
  try {
    const { tournament_id } = req.body;
    if (!tournament_id) return res.status(400).json({ error: 'tournament_id requerido' });

    await db.query('DELETE FROM tournaments WHERE id = ?', [tournament_id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;