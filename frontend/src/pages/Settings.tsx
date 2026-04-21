import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import api from '../services/api';
import '../App.css';

const Settings = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setMessage({ type: 'error', text: 'New passwords do not match' });
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setMessage({ type: 'success', text: res.data.message });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: '120px', maxWidth: '800px' }}>
      <Helmet>
        <title>Settings | BlogMax</title>
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: 'var(--card-bg)', 
          padding: '48px', 
          borderRadius: '24px', 
          border: '1px solid var(--border-color)' 
        }}
      >
        <h1 style={{ fontSize: '32px', marginBottom: '32px', color: 'var(--text-color)' }}>Account Settings</h1>
        
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px', color: 'var(--primary-bright)' }}>Change Password</h2>
          
          {message.text && (
            <div style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '24px', 
              background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: message.type === 'error' ? 'var(--danger)' : '#10b981',
              border: `1px solid ${message.type === 'error' ? 'var(--danger)' : '#10b981'}`,
              fontSize: '14px'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Current Password</label>
              <input 
                type="password"
                className="form-control"
                style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', color: 'var(--text-color)' }}
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>New Password</label>
                <input 
                  type="password"
                  className="form-control"
                  style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', color: 'var(--text-color)' }}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Confirm New Password</label>
                <input 
                  type="password"
                  className="form-control"
                  style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', color: 'var(--text-color)' }}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ alignSelf: 'flex-start', padding: '12px 32px', borderRadius: '30px', marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div style={{ paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--danger)' }}>Danger Zone</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button 
            className="btn-secondary"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '12px 32px', borderRadius: '30px' }}
            onClick={() => alert('Account deletion feature coming soon!')}
          >
            Delete Account
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
