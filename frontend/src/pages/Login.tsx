import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextParam = new URLSearchParams(location.search).get('next');
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/';

  useEffect(() => {
    const saved = localStorage.getItem('blogmax_remember_email');
    if (saved) {
      setEmail(saved);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    if (!rememberEmail) {
      localStorage.removeItem('blogmax_remember_email');
      return;
    }
    const trimmed = email.trim();
    if (trimmed) localStorage.setItem('blogmax_remember_email', trimmed);
  }, [rememberEmail, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email: email.trim(), password });
      login(res.data.token, res.data.user);
      navigate(nextPath);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--premium">
      <div className="auth-backdrop" aria-hidden="true" />
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="auth-shell"
      >
        <aside className="auth-aside">
          <div className="auth-badge">
            <span className="auth-badge-icon" aria-hidden="true"><Sparkles size={14} /></span>
            <span>Premium publishing</span>
          </div>
          <h2 className="auth-aside-title">Welcome back</h2>
          <p className="auth-aside-subtitle">Sign in and continue where you left off.</p>
          <ul className="auth-highlights">
            <li>Autosave + version history</li>
            <li>Trending &amp; personalized feeds</li>
            <li>Mentions, reactions, and notifications</li>
          </ul>
        </aside>

        <div className="auth-card auth-card--form">
          <h2 className="auth-title">Sign in</h2>
          <p className="auth-subtitle">Enter your email and password to access BlogMax.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error" role="alert">
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div className="form-field">
                <span className="form-field-icon" aria-hidden="true"><Mail size={18} /></span>
                <input
                  type="email"
                  required
                  className="form-input form-input--icon"
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="form-field">
                <span className="form-field-icon" aria-hidden="true"><Lock size={18} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="form-input form-input--icon form-input--with-action"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="form-field-action"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-meta">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                />
                <span>Remember email</span>
              </label>
              <span className="auth-meta-hint">Tip: use the menu to explore features.</span>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="auth-footer">
              <span>Don&apos;t have an account?</span>{' '}
              <Link to={`/register?next=${encodeURIComponent(nextPath)}`} className="auth-link">
                Create account
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
