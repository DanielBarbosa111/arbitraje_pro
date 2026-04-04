// =====================================================
// Arbitraje Pro — Rutas de Autenticación
// =====================================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

    const [rows] = await db.query(
      'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
      [username.trim(), password]
    );

    if (!rows.length)
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar admins (solo super_admin)
router.get('/admins', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear admin (solo super_admin)
router.post('/create-admin', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

    // Verificar que no exista
    const [exists] = await db.query(
      'SELECT id FROM users WHERE username = ?', [username.trim()]
    );
    if (exists.length)
      return res.status(400).json({ error: 'Ese usuario ya existe' });

    const validRoles = ['admin', 'super_admin'];
    const userRole = validRoles.includes(role) ? role : 'admin';
    await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username.trim(), password, userRole]
    );
    res.status(201).json({ created: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar admin (solo super_admin)
router.post('/delete-admin', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

    // No permitir eliminar super_admin
    const [check] = await db.query(
      'SELECT role FROM users WHERE id = ?', [user_id]
    );
    if (check.length && check[0].role === 'super_admin')
      return res.status(400).json({ error: 'No puedes eliminar al Super Admin' });

    await db.query('DELETE FROM users WHERE id = ?', [user_id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar usuario (username y/o contraseña)
router.post('/update-admin', async (req, res) => {
  try {
    const { user_id, username, password, role } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

    if (username && username.trim()) {
      // Verificar que no exista otro con ese nombre
      const [[dup]] = await db.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username.trim(), user_id]
      );
      if (dup) return res.status(400).json({ error: 'Ese nombre de usuario ya existe' });
      await db.query('UPDATE users SET username = ? WHERE id = ?', [username.trim(), user_id]);
    }

    if (password && password.trim()) {
      await db.query('UPDATE users SET password = ? WHERE id = ?', [password.trim(), user_id]);
    }

    if (role && ['admin', 'super_admin'].includes(role)) {
      await db.query('UPDATE users SET role = ? WHERE id = ?', [role, user_id]);
    }

    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;