// =====================================================
// Arbitraje Pro — Botón cambiar tema
// =====================================================

import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
    </button>
  );
}