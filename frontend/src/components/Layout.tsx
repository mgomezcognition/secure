import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Layers } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  navItems: Array<{ path: string; icon: ReactNode; label: string }>; 
}

export function Layout({ children, navItems }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const ThemeIcon = resolvedTheme === 'dark' ? '🌙' : '☀️';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <div className="logo-icon" style={{ background: '#635bff' }}>
              <Layers size={20} color="white" />
            </div>
            {!isSidebarCollapsed && (
              <span className="logo-text">Cognition Secure</span>
            )}
          </Link>
          <button 
            className="collapse-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!isSidebarCollapsed && <span className="nav-section-title">Menú</span>}
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="sidebar-footer">
          {/* Theme Selector */}
          <div className="theme-selector-container">
            <button 
              className="theme-toggle-btn"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title="Cambiar tema"
            >
              <span>{ThemeIcon}</span>
              {!isSidebarCollapsed && <span>Tema: {theme === 'system' ? 'Sistema' : theme === 'dark' ? 'Oscuro' : 'Claro'}</span>}
            </button>
            {showThemeMenu && (
              <div className="theme-menu">
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    className={`theme-option ${theme === t ? 'active' : ''}`}
                    onClick={() => {
                      setTheme(t as 'light' | 'dark' | 'system');
                      setShowThemeMenu(false);
                    }}
                  >
                    <span>{t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}</span>
                    <span>{t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Sistema'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isSidebarCollapsed && user && (
            <div className="user-info">
              <div className="user-avatar" style={{ background: '#635bff' }}>
                {user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="user-details">
                <span className="user-email">{user.email}</span>
                <span className="user-role">{user.role || 'Usuario'}</span>
              </div>
            </div>
          )}
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <span>🚪</span>
            {!isSidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
        <div className="mobile-logo">
          <Layers size={20} color="#635bff" />
          <span>Cognition Secure</span>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay active" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="mobile-sidebar" onClick={e => e.stopPropagation()}>
            <div className="sidebar-header">
              <Link to="/" className="sidebar-logo">
                <div className="logo-icon" style={{ background: '#635bff' }}>
                  <Layers size={20} color="white" />
                </div>
                <span className="logo-text">Cognition Secure</span>
              </Link>
            </div>
            <nav className="sidebar-nav">
              <div className="nav-section">
                <span className="nav-section-title">Menú</span>
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <div className="sidebar-footer">
              {user && (
                <div className="user-info">
                  <div className="user-avatar" style={{ background: '#635bff' }}>
                    {user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="user-details">
                    <span className="user-email">{user.email}</span>
                    <span className="user-role">{user.role || 'Usuario'}</span>
                  </div>
                </div>
              )}
              <button className="logout-btn" onClick={handleLogout}>
                <span>🚪</span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
