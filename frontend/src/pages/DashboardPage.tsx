import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface DashboardStats {
  totalItems: number;
  completedItems: number;
  pendingItems: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    completedItems: 0,
    pendingItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call when backend endpoints are ready
      // const result = await api.get<DashboardStats>('/api/dashboard/stats');
      // if (result.data) setStats(result.data);
      
      // Simulated data for demo
      setStats({
        totalItems: 12,
        completedItems: 8,
        pendingItems: 4,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = () => {
    setShowModal(true);
    // TODO: Implement modal logic
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const progressPercent = stats.totalItems > 0 
    ? Math.round((stats.completedItems / stats.totalItems) * 100) 
    : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Bienvenido a Cognition Secure</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={loadStats} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button className="btn btn-primary" onClick={handleCreateItem}>
            <Plus size={18} />
            Nuevo Item
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="stats-icon purple">
              <span style={{ fontSize: '24px' }}>📊</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Items</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {loading ? '...' : stats.totalItems}
              </p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="stats-icon green">
              <span style={{ fontSize: '24px' }}>✅</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Completados</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {loading ? '...' : stats.completedItems}
              </p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="stats-icon blue">
              <span style={{ fontSize: '24px' }}>📈</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Progreso</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {loading ? '...' : `${progressPercent}%`}
              </p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="stats-icon orange">
              <span style={{ fontSize: '24px' }}>⏳</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Pendientes</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {loading ? '...' : stats.pendingItems}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Actividad Reciente
          </h2>
          <button className="btn btn-ghost" style={{ fontSize: '13px' }}>
            Ver todo
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Aquí se mostrará la actividad reciente de tu aplicación.
          Usa el menú de navegación a la izquierda para acceder a los diferentes módulos.
        </p>
      </div>

      {/* Simple Modal Example */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Nuevo Item
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Formulario de creación - Personaliza según tus necesidades.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleCloseModal}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
