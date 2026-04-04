// =====================================================
// Arbitraje Pro — Header con tabs y login
// =====================================================

const publicTabs = [
  { id: 'equipos',       label: '👥 Equipos' },
  { id: 'fase1',         label: '⚽ Fase de Grupos' },
  { id: 'clasificacion', label: '🏅 Clasificados' },
  { id: 'fase2',         label: '🏆 Llaves' },
  { id: 'stats',         label: '📊 Estadísticas' },
];

const adminTabs = [
  { id: 'config',        label: '⚙️ Configuración' },
  { id: 'equipos',       label: '👥 Equipos' },
  { id: 'fase1',         label: '⚽ Fase de Grupos' },
  { id: 'clasificacion', label: '🏅 Clasificados' },
  { id: 'fase2',         label: '🏆 Llaves' },
  { id: 'stats',         label: '📊 Estadísticas' },
];

const superAdminTabs = [
  { id: 'usuarios',      label: '👥 Usuarios' },
  { id: 'config',        label: '⚙️ Configuración' },
  { id: 'equipos',       label: '👥 Equipos' },
  { id: 'fase1',         label: '⚽ Fase de Grupos' },
  { id: 'clasificacion', label: '🏅 Clasificados' },
  { id: 'fase2',         label: '🏆 Llaves' },
  { id: 'stats',         label: '📊 Estadísticas' },
];

export default function Header({ activeTab, onTabChange, user, onLoginClick, onLogout }) {
  let tabs = publicTabs;
  if (user?.role === 'super_admin') tabs = superAdminTabs;
  else if (user?.role === 'admin') tabs = adminTabs;

  return (
    <>
      <div className="app-header">
        <h1 className="app-title">⚽ Sistema de Arbitraje Pro</h1>
      </div>

      <div className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}