import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, LogIn } from 'lucide-react';

// Cognition Secure Logo Component
function AppLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="appLoginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#635bff"/>
          <stop offset="100%" stopColor="#00d4ff"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#appLoginGrad)"/>
      <g transform="translate(26, 26)" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="24 4 4 14 24 24 44 14 24 4"/>
        <polyline points="4 34 24 44 44 34"/>
        <polyline points="4 24 24 34 44 24"/>
      </g>
    </svg>
  );
}

export function LoginPage() {
  const [error, setError] = useState('');
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const { loginWithSso, loginWithSsoToken, isSsoAvailable, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle SSO token from URL (redirected from Suite)
  useEffect(() => {
    const ssoToken = searchParams.get('sso_token');
    if (ssoToken && !isAuthenticated) {
      setIsSsoLoading(true);
      loginWithSsoToken(ssoToken)
        .then((success) => {
          if (success) {
            window.history.replaceState({}, '', '/login');
            navigate('/dashboard');
          } else {
            setError('Error al validar sesión de Cognition Suite');
          }
        })
        .catch(() => {
          setError('Error al conectar con Cognition Suite');
        })
        .finally(() => {
          setIsSsoLoading(false);
        });
    }
  }, [searchParams, isAuthenticated, loginWithSsoToken, navigate]);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSsoLogin = async () => {
    setError('');
    setIsSsoLoading(true);

    try {
      const success = await loginWithSso();
      if (success) {
        navigate('/dashboard');
      }
    } catch {
      setError('Error al iniciar sesión con Cognition Suite');
    } finally {
      setIsSsoLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      background: 'linear-gradient(135deg, #1a1f36 0%, #0a2540 50%, #1a1f36 100%)'
    }}>
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="login-branding-panel" style={{
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, #635bff25 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <AppLogo size={56} />
            <span style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
              Cognition Cognition Secure
            </span>
          </div>
          
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: 'white',
            lineHeight: '1.2',
            marginBottom: '24px'
          }}>
            Bienvenido a<br />
            <span style={{ color: '#635bff' }}>Cognition Secure</span>
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.6)',
            maxWidth: '400px',
            lineHeight: '1.6'
          }}>
            Gestiona tu negocio de forma inteligente con Cognition Secure, integrado a Cognition Suite para una experiencia unificada.
          </p>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="login-form-panel" style={{
        width: '100%',
        maxWidth: '480px',
        minWidth: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'white'
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Iniciar sesión
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Accede con tu cuenta de Cognition Suite
            </p>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'rgba(255, 82, 82, 0.1)',
              borderRadius: '8px',
              marginBottom: '24px',
              color: '#e04848',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* SSO Button */}
          <button
            type="button"
            onClick={handleSsoLogin}
            disabled={isSsoLoading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '15px',
              background: 'linear-gradient(135deg, #635bff 0%, #00d4ff 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSsoLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.2s',
              opacity: isSsoLoading ? 0.7 : 1
            }}
          >
            <LogIn size={18} />
            {isSsoLoading 
              ? 'Conectando con Suite...' 
              : isSsoAvailable 
                ? 'Continuar con Cognition Suite' 
                : 'Iniciar sesión con Cognition Suite'
            }
          </button>
          
          {isSsoAvailable && (
            <p style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)', 
              textAlign: 'center',
              marginTop: '12px'
            }}>
              ✓ Sesión de Suite detectada
            </p>
          )}

          <div style={{
            marginTop: '32px',
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Para acceder a Cognition Cognition Secure necesitas una cuenta activa en Cognition Suite
            </p>
          </div>

          {/* Cognition Software branding */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a
              href="https://www.cognition.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
            >
              Diseñado y desarrollado por <span style={{ fontWeight: '600' }}>Cognition Software</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .login-branding-panel { display: none !important; }
          .login-form-panel { 
            width: 100% !important; 
            max-width: 100% !important;
            min-width: auto !important;
            min-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}
