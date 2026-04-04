// =====================================================
// Arbitraje Pro — App principal con roles
// =====================================================

import { useState } from 'react';
import NavbarInstitucional from './components/institutional/NavbarInstitucional';
import FooterInstitucional from './components/institutional/FooterInstitucional';
import { ThemeProvider } from './context/ThemeContext';
import { useToast } from './hooks/useToast';
import Header from './components/layout/Header';
import Toast from './components/ui/Toast';
import LoginForm from './components/ui/LoginForm';
import ConfigPage from './components/config/ConfigPage';
import UsersPage from './components/config/UsersPage';
import EquiposPage from './components/equipos/EquiposPage';
import Fase1Page from './components/fase1/Fase1Page';
import ClasificacionPage from './components/clasificacion/ClasificacionPage';
import Fase2Page from './components/fase2/Fase2Page';
import StatsPage from './components/stats/StatsPage';

function AppContent() {
  const [activeTab, setActiveTab] = useState('fase1');
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const { toast, showToast } = useToast();

  function handleLogin(userData) {
    setUser(userData);
    setShowLogin(false);
    setActiveTab('config');
    showToast(`✅ Bienvenido, ${userData.username}`, 'success');
  }

  function handleLogout() {
    setUser(null);
    setActiveTab('fase1');
    showToast('👋 Sesión cerrada', 'info');
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      {/* ── Navbar institucional CTC ── */}
      <NavbarInstitucional />

      <div className="container">
        {/* Botón admin — position:absolute dentro del .container */}
        <div className="header-auth-corner">
          {user ? (
            <button className="btn-auth btn-logout" onClick={handleLogout}>
              👤 {user.username} ({user.role === 'super_admin' ? 'Super Admin' : 'Admin'}) · Salir
            </button>
          ) : (
            <button className="btn-auth btn-login" onClick={() => setShowLogin(true)}>
              🔐 Admin
            </button>
          )}
        </div>

        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          user={user}
          onLoginClick={() => setShowLogin(true)}
          onLogout={handleLogout}
        />

        {activeTab === 'usuarios' && isSuperAdmin && (
          <UsersPage showToast={showToast} />
        )}

        {activeTab === 'config' && isAdmin && (
          <ConfigPage showToast={showToast} />
        )}

        {activeTab === 'equipos' && (
          <EquiposPage showToast={showToast} />
        )}

        {activeTab === 'fase1' && (
          <Fase1Page showToast={showToast} isAdmin={isAdmin} />
        )}

        {activeTab === 'clasificacion' && (
          <ClasificacionPage showToast={showToast} isAdmin={isAdmin} />
        )}

        {activeTab === 'fase2' && (
          <Fase2Page showToast={showToast} isAdmin={isAdmin} />
        )}

        {activeTab === 'stats' && (
          <StatsPage showToast={showToast} />
        )}

        {showLogin && (
          <LoginForm
            onLogin={handleLogin}
            onClose={() => setShowLogin(false)}
          />
        )}

        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>

      {/* ── Footer institucional CTC ── */}
      <FooterInstitucional />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}