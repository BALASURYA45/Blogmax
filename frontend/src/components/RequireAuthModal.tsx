import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  onClose: () => void;
  nextPath: string;
  title?: string;
  description?: string;
};

const RequireAuthModal = ({ open, onClose, nextPath, title, description }: Props) => {
  const navigate = useNavigate();

  if (!open) return null;

  const goTo = (path: '/login' | '/register') => {
    navigate(`${path}?next=${encodeURIComponent(nextPath)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 100%)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          background: 'var(--surface-color)',
          color: 'var(--text-color)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          padding: '28px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
              {title || 'Sign in required'}
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {description || 'Please sign in or create an account to continue.'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '22px' }}>
          <button className="btn-secondary" style={{ flex: 1, padding: '12px 16px' }} onClick={() => goTo('/login')}>
            Login
          </button>
          <button className="btn-primary" style={{ flex: 1, padding: '12px 16px' }} onClick={() => goTo('/register')}>
            Register
          </button>
        </div>

        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontWeight: 600
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequireAuthModal;

