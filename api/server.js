require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const auth        = require('./routes/auth');
const tournaments = require('./routes/tournaments');
const jornadas    = require('./routes/jornadas');
const teams       = require('./routes/teams');
const fase1       = require('./routes/fase1');
const fase2       = require('./routes/fase2');
const stats       = require('./routes/stats');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/auth',        auth);
app.use('/tournaments', tournaments);
app.use('/jornadas',    jornadas);
app.use('/teams',       teams);
app.use('/fase1',       fase1);
app.use('/fase2',       fase2);
app.use('/stats',       stats);

app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'Arbitraje Pro API corriendo' });
});

// ── Migraciones automáticas al arrancar ─────────────────────────────────────
const db = require('./config/db');
async function runMigrations() {
  try {
    await db.query('ALTER TABLE tournaments ADD COLUMN visible tinyint(1) NOT NULL DEFAULT 1');
    console.log('[migration] Columna tournaments.visible agregada');
  } catch (e) {
    // Ya existe — no pasa nada
  }
}
runMigrations();

app.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:' + PORT);
});