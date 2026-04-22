import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Sparkles, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextParam = new URLSearchParams(location.search).get('next');
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const res = await api.post('/auth/register', { 
        username: username.trim(), 
        email: email.trim(), 
        password
      });
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
            <span>Start publishing</span>
          </div>
          <h2 className="auth-aside-title">Create your account</h2>
          <p className="auth-aside-subtitle">Join writers, builders, and storytellers on BlogMax.</p>
          <ul className="auth-highlights">
            <li>Schedule posts to publish automatically</li>
            <li>Get discovered via tags &amp; trending</li>
            <li>Build an audience with follows</li>
          </ul>
        </aside>

        <div className="auth-card auth-card--form">
          <h2 className="auth-title">Sign up</h2>
          <p className="auth-subtitle">Create an account in seconds.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error" role="alert">
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label>Username</label>
              <div className="form-field">
                <span className="form-field-icon" aria-hidden="true"><UserIcon size={18} /></span>
                <input
                  type="text"
                  required
                  minLength={3}
                  className="form-input form-input--icon"
                  placeholder="Choose a username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-help">At least 3 characters.</div>
            </div>

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
                  placeholder="Create a password"
                  autoComplete="new-password"
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
              <div className="form-help">Minimum 6 characters.</div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="form-field">
                <span className="form-field-icon" aria-hidden="true"><Lock size={18} /></span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="form-input form-input--icon form-input--with-action"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="form-field-action"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword((p) => !p)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <div className="auth-footer">
              <span>Already have an account?</span>{' '}
              <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="auth-link">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
