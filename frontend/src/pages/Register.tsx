import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    try {
      const res = await api.post('/auth/register', { 
        username, 
        email, 
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
    <div className="auth-page">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="auth-card"
      >
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join our community of writers today</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-error">{error}</motion.div>}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder=" "
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
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ padding: '14px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Get Started'}
          </button>
          <div className="auth-footer">
            Already have an account?{' '}
            <Link to={`/login?next=${encodeURIComponent(nextPath)}`} style={{ color: 'var(--primary-bright)', fontWeight: '600' }}>
              Sign in
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
