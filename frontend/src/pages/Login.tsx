import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextParam = new URLSearchParams(location.search).get('next');
  const nextPath = nextParam && nextParam.startsWith('/') ? nextParam : '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate(nextPath);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-page">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="auth-card"
      >
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Please enter your details to sign in</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error">
              {error}
            </motion.div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="e.g. name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '14px', marginTop: '10px' }}>
            Sign in to Platform
          </button>
          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to={`/register?next=${encodeURIComponent(nextPath)}`} style={{ color: 'var(--primary-bright)', fontWeight: '600' }}>
              Create account
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
