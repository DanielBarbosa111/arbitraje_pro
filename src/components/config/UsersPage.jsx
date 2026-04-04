// =====================================================
// Arbitraje Pro — Gestión de Usuarios (Super Admin)
// =====================================================

import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function UsersPage({ showToast }) {
  const [admins, setAdmins]       = useState([]);
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [newRole, setNewRole]     = useState('admin');
  // editing: { id, username, password, role }
  const [editing, setEditing]     = useState(null);
  const [showPass, setShowPass]   = useState({});

  async function loadAdmins() {
    try { setAdmins(await api('/auth/admins')); }
    catch (err) { showToast(err.message, 'danger'); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('⚠️ Ingresa usuario y contraseña', 'warning');
      return;
    }
    try {
      await api('/auth/create-admin', { username: username.trim(), password, role: newRole });
      showToast(`✅ Admin "${username}" creado`, 'success');
      setUsername(''); setPassword(''); setNewRole('admin');
      await loadAdmins();
    } catch (err) { showToast(err.message, 'danger'); }
  }

  async function handleDelete(userId, name) {
    if (!confirm(`¿Eliminar al administrador "${name}"?`)) return;
    try {
      await api('/auth/delete-admin', { user_id: userId });
      showToast(`🗑️ Admin "${name}" eliminado`, 'danger');
      await loadAdmins();
    } catch (err) { showToast(err.message, 'danger'); }
  }

  async function handleUpdate() {
    if (!editing) return;
    if (!editing.username.trim()) {
      showToast('⚠️ El nombre de usuario no puede estar vacío', 'warning');
      return;
    }
    try {
      await api('/auth/update-admin', {
        user_id:  editing.id,
        username: editing.username.trim(),
        password: editing.password || undefined,
        role:     editing.role,
      });
      showToast('✅ Usuario actualizado', 'success');
      setEditing(null);
      await loadAdmins();
    } catch (err) { showToast(err.message, 'danger'); }
  }

  useEffect(() => { loadAdmins(); }, []);

  const roleLabel = r => r === 'super_admin' ? 'Super Admin' : 'Admin';
  const roleBadge = r => r === 'super_admin' ? 'badge-success' : 'badge-info';
  const roleIcon  = r => r === 'super_admin' ? '🛡️' : '👤';

  return (
    <div className="section">
      <h2>👥 Gestión de Usuarios</h2>

      {/* ── Crear admin ── */}
      <div className="form-box">
        <h3>➕ Crear Nuevo Administrador</h3>
        <form onSubmit={handleCreate} className="form-group">
          <input
            type="text"
            placeholder="Nombre de usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className="user-role-selector">
            <label className="user-role-label">Rol del usuario</label>
            <div className="user-role-btns">
              <button
                type="button"
                className={`user-role-btn ${newRole === 'admin' ? 'user-role-btn--active' : ''}`}
                onClick={() => setNewRole('admin')}
              >
                👤 Admin
              </button>
              <button
                type="button"
                className={`user-role-btn ${newRole === 'super_admin' ? 'user-role-btn--active-super' : ''}`}
                onClick={() => setNewRole('super_admin')}
              >
                🛡️ Super Admin
              </button>
            </div>
          </div>
          <div className="btn-center">
            <button type="submit" className="btn btn-primary">✔ Crear Admin</button>
          </div>
        </form>
      </div>

      {/* ── Lista ── */}
      <div className="section-label">Usuarios Registrados</div>
      <div className="users-grid">
        {admins.map(a => (
          <div key={a.id} className={`user-card ${a.role === 'super_admin' ? 'user-card--super' : ''}`}>

            {/* Cabecera */}
            <div className="user-card-header">
              <div className="user-card-avatar">{roleIcon(a.role)}</div>
              <div className="user-card-info">
                <span className="user-card-name">{a.username}</span>
                <span className={`badge ${roleBadge(a.role)}`}>{roleLabel(a.role)}</span>
              </div>
            </div>

            <p className="user-card-date">
              Creado: {new Date(a.created_at).toLocaleDateString('es-CO')}
            </p>

            {/* Modo edición */}
            {editing?.id === a.id ? (
              <div className="user-edit-form">
                <div className="user-edit-field">
                  <label>Usuario</label>
                  <input
                    type="text"
                    value={editing.username}
                    onChange={e => setEditing({ ...editing, username: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                  />
                </div>
                <div className="user-edit-field">
                  <label>Nueva contraseña <span style={{ opacity: 0.5, fontSize: '0.8em' }}>(vacío = no cambiar)</span></label>
                  <div className="user-pass-wrap">
                    <input
                      type={showPass[a.id] ? 'text' : 'password'}
                      placeholder="Nueva contraseña"
                      value={editing.password}
                      onChange={e => setEditing({ ...editing, password: e.target.value })}
                    />
                    <button
                      className="user-pass-toggle"
                      type="button"
                      onClick={() => setShowPass(p => ({ ...p, [a.id]: !p[a.id] }))}
                    >
                      {showPass[a.id]
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
                <div className="user-edit-field">
                  <label>Rol</label>
                  <div className="user-role-btns">
                    <button
                      type="button"
                      className={`user-role-btn ${editing.role === 'admin' ? 'user-role-btn--active' : ''}`}
                      onClick={() => setEditing({ ...editing, role: 'admin' })}
                    >
                      👤 Admin
                    </button>
                    <button
                      type="button"
                      className={`user-role-btn ${editing.role === 'super_admin' ? 'user-role-btn--active-super' : ''}`}
                      onClick={() => setEditing({ ...editing, role: 'super_admin' })}
                    >
                      🛡️ Super Admin
                    </button>
                  </div>
                </div>
                <div className="user-edit-actions">
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdate}>
                    ✔ Guardar
                  </button>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setEditing(null)}>
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* Acciones normales */
              <div className="user-card-actions">
                <button
                  className="btn btn-info"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.82em' }}
                  onClick={() => setEditing({ id: a.id, username: a.username, password: '', role: a.role })}
                >
                  ✏️ Editar
                </button>
                {a.role !== 'super_admin' && (
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, padding: '7px 10px', fontSize: '0.82em' }}
                    onClick={() => handleDelete(a.id, a.username)}
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}