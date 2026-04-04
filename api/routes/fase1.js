const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Generar enfrentamientos round-robin
router.post('/generate', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { subtorneo_id } = req.body;
    if (!subtorneo_id) return res.status(400).json({ error: 'subtorneo_id requerido' });

    const [jornadas] = await conn.query(
      'SELECT id FROM jornadas WHERE subtorneo_id = ?', [subtorneo_id]
    );
    if (!jornadas.length) return res.status(400).json({ error: 'No hay jornadas' });

    for (const j of jornadas) {
      const [count] = await conn.query(
        'SELECT COUNT(*) AS total FROM teams WHERE jornada_id = ?', [j.id]
      );
      if (count[0].total > 0 && count[0].total < 2) {
        return res.status(400).json({ error: 'Una jornada tiene solo 1 equipo. Se necesitan al menos 2.' });
      }
    }

    for (const j of jornadas) {
      await conn.query('DELETE FROM fase1_matches WHERE jornada_id = ?', [j.id]);
    }

    await conn.beginTransaction();

    for (const j of jornadas) {
      const [teams] = await conn.query(
        'SELECT id FROM teams WHERE jornada_id = ? ORDER BY id', [j.id]
      );
      if (teams.length < 2) continue;

      const ids = teams.map(t => t.id);
      for (let i = 0; i < ids.length; i++) {
        for (let k = i + 1; k < ids.length; k++) {
          await conn.query(
            'INSERT INTO fase1_matches (jornada_id, team1_id, team2_id) VALUES (?,?,?)',
            [j.id, ids[i], ids[k]]
          );
        }
      }
    }

    await conn.query(
      "UPDATE subtorneos SET status = 'fase1' WHERE id = ?", [subtorneo_id]
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

// Listar partidos de una jornada (con goles y tarjetas)
router.get('/matches', async (req, res) => {
  try {
    const jid = req.query.jornada_id;
    if (!jid) return res.status(400).json({ error: 'jornada_id requerido' });

    const [rows] = await db.query(`
      SELECT fm.id, fm.jornada_id,
             fm.team1_id, t1.name AS team1_name,
             fm.team2_id, t2.name AS team2_name,
             fm.score1, fm.score2, fm.completed
      FROM fase1_matches fm
      INNER JOIN teams t1 ON t1.id = fm.team1_id
      INNER JOIN teams t2 ON t2.id = fm.team2_id
      WHERE fm.jornada_id = ?
      ORDER BY fm.id
    `, [jid]);

    for (const match of rows) {
      const [goals] = await db.query(
        'SELECT id, team_id, player_name FROM fase1_goals WHERE match_id = ? ORDER BY id',
        [match.id]
      );
      match.goals = goals;

      const [cards] = await db.query(
        'SELECT id, team_id, player_name, card_type FROM fase1_cards WHERE match_id = ? ORDER BY id',
        [match.id]
      );
      match.cards = cards;
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resumen de un partido específico
router.get('/match-summary', async (req, res) => {
  try {
    const mid = req.query.match_id;
    if (!mid) return res.status(400).json({ error: 'match_id requerido' });

    const [matchRows] = await db.query(`
      SELECT fm.id, fm.jornada_id,
             fm.team1_id, t1.name AS team1_name,
             fm.team2_id, t2.name AS team2_name,
             fm.score1, fm.score2, fm.completed
      FROM fase1_matches fm
      INNER JOIN teams t1 ON t1.id = fm.team1_id
      INNER JOIN teams t2 ON t2.id = fm.team2_id
      WHERE fm.id = ?
    `, [mid]);

    if (!matchRows.length) return res.status(404).json({ error: 'Partido no encontrado' });

    const match = matchRows[0];

    const [goals] = await db.query(
      'SELECT id, team_id, player_name FROM fase1_goals WHERE match_id = ? ORDER BY id',
      [mid]
    );

    const [cards] = await db.query(
      'SELECT id, team_id, player_name, card_type FROM fase1_cards WHERE match_id = ? ORDER BY id',
      [mid]
    );

    match.goals = goals;
    match.cards = cards;

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar resultado con goles y tarjetas
router.post('/save-result', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { match_id, score1, score2, goals, cards } = req.body;

    if (!match_id && match_id !== 0) return res.status(400).json({ error: 'match_id requerido' });

    await conn.beginTransaction();

    await conn.query(
      'UPDATE fase1_matches SET score1=?, score2=?, completed=1 WHERE id=?',
      [score1 || 0, score2 || 0, match_id]
    );

    // Borrar goles y tarjetas anteriores
    await conn.query('DELETE FROM fase1_goals WHERE match_id = ?', [match_id]);
    await conn.query('DELETE FROM fase1_cards WHERE match_id = ?', [match_id]);

    // Guardar goles
    if (goals && Array.isArray(goals) && goals.length > 0) {
      for (const g of goals) {
        if (g.player_name && g.player_name.trim() && g.team_id) {
          await conn.query(
            'INSERT INTO fase1_goals (match_id, team_id, player_name) VALUES (?,?,?)',
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
            'INSERT INTO fase1_cards (match_id, team_id, player_name, card_type) VALUES (?,?,?,?)',
            [match_id, c.team_id, c.player_name.trim(), c.card_type]
          );
        }
      }
    }

    await conn.commit();
    res.json({ saved: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Tabla de posiciones
router.get('/standings', async (req, res) => {
  try {
    const jid = req.query.jornada_id;
    if (!jid) return res.status(400).json({ error: 'jornada_id requerido' });

    const [teams] = await db.query(
      'SELECT id, name FROM teams WHERE jornada_id = ? ORDER BY name', [jid]
    );

    const [matches] = await db.query(
      'SELECT * FROM fase1_matches WHERE jornada_id = ? AND completed = 1', [jid]
    );

    const table = {};
    for (const t of teams) {
      table[t.id] = {
        team_id: t.id, name: t.name,
        pj: 0, pg: 0, pe: 0, pp: 0,
        gf: 0, gc: 0, dg: 0, pts: 0,
      };
    }

    for (const m of matches) {
      const t1 = m.team1_id, t2 = m.team2_id;
      const s1 = m.score1,   s2 = m.score2;
      if (!table[t1] || !table[t2]) continue;

      table[t1].pj++; table[t2].pj++;
      table[t1].gf += s1; table[t1].gc += s2;
      table[t2].gf += s2; table[t2].gc += s1;

      if (s1 > s2) {
        table[t1].pg++; table[t1].pts += 3;
        table[t2].pp++;
      } else if (s2 > s1) {
        table[t2].pg++; table[t2].pts += 3;
        table[t1].pp++;
      } else {
        table[t1].pe++; table[t2].pe++;
        table[t1].pts += 1; table[t2].pts += 1;
      }
    }

    const sorted = Object.values(table).map(r => {
      r.dg = r.gf - r.gc;
      return r;
    }).sort((a, b) => {
      if (a.pts !== b.pts) return b.pts - a.pts;
      if (a.dg !== b.dg)   return b.dg - a.dg;
      return b.gf - a.gf;
    });

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clasificación
router.get('/clasificacion', async (req, res) => {
  try {
    const sid = req.query.subtorneo_id;
    if (!sid) return res.status(400).json({ error: 'subtorneo_id requerido' });

    const [jornadas] = await db.query(`
      SELECT j.id, j.name, j.cupos_base,
             COUNT(DISTINCT t.id) AS teams_count
      FROM jornadas j
      LEFT JOIN teams t ON t.jornada_id = j.id
      WHERE j.subtorneo_id = ?
      GROUP BY j.id
      ORDER BY j.id
    `, [sid]);

    const cuposData = [];
    const normales = [];

    for (const j of jornadas) {
      const tc = j.teams_count;
      const cb = j.cupos_base;
      const cf = tc < cb ? Math.max(0, tc - 1) : cb;
      cuposData.push({
        jornada_id: j.id, name: j.name,
        teams_count: tc, cupos_base: cb, cupos_final: cf,
      });
      if (tc >= cb) normales.push(cuposData.length - 1);
    }

    let asignados = cuposData.reduce((s, c) => s + c.cupos_final, 0);
    let faltantes = 8 - asignados;

    if (faltantes > 0 && normales.length) {
      normales.sort((a, b) => cuposData[b].teams_count - cuposData[a].teams_count);
      let i = 0;
      while (faltantes > 0 && i < 100) {
        const idx = normales[i % normales.length];
        if (cuposData[idx].cupos_final < cuposData[idx].teams_count - 1) {
          cuposData[idx].cupos_final++;
          faltantes--;
        }
        i++;
      }
    }

    const clasificados = [];
    for (const info of cuposData) {
      if (info.cupos_final <= 0) continue;

      const [teams] = await db.query(
        'SELECT id, name FROM teams WHERE jornada_id = ?', [info.jornada_id]
      );
      const [matches] = await db.query(
        'SELECT * FROM fase1_matches WHERE jornada_id = ? AND completed = 1', [info.jornada_id]
      );

      const tbl = {};
      for (const t of teams) {
        tbl[t.id] = { team_id: t.id, name: t.name, pts: 0, dg: 0, gf: 0 };
      }
      for (const m of matches) {
        const t1 = m.team1_id, t2 = m.team2_id;
        const s1 = m.score1,   s2 = m.score2;
        if (!tbl[t1] || !tbl[t2]) continue;
        tbl[t1].gf += s1; tbl[t2].gf += s2;
        tbl[t1].dg += (s1 - s2); tbl[t2].dg += (s2 - s1);
        if (s1 > s2) tbl[t1].pts += 3;
        else if (s2 > s1) tbl[t2].pts += 3;
        else { tbl[t1].pts += 1; tbl[t2].pts += 1; }
      }

      const sorted = Object.values(tbl).sort((a, b) => {
        if (a.pts !== b.pts) return b.pts - a.pts;
        if (a.dg !== b.dg) return b.dg - a.dg;
        return b.gf - a.gf;
      });

      sorted.slice(0, info.cupos_final).forEach((team, pos) => {
        clasificados.push({
          team_id: team.team_id, team_name: team.name,
          jornada_id: info.jornada_id, jornada_name: info.name,
          position: pos + 1, pts: team.pts, dg: team.dg, gf: team.gf,
        });
      });
    }

    res.json({ cupos: cuposData, clasificados, total: clasificados.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;