import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import '../App.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;
  const nextPath = `${location.pathname}${location.search}`;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch existing notifications
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotifications();

    // Socket.io connection
    const socket = io('http://localhost:5000'); // Use your backend URL
    socket.emit('join', user.id || user._id);

    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.put('/notifications/read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      markAsRead();
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-logo">BlogMax</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <form onSubmit={handleSearch} className="nav-search">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
            />
          </form>
          <button 
            onClick={toggleTheme} 
            className={`theme-toggle ${theme}`}
            title={`Switch to ${theme === 'black' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'black' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {!user ? (
            <>
              <Link
                to={`/login?next=${encodeURIComponent('/create')}`}
                className="btn-primary"
                style={{ padding: '8px 24px', fontSize: '14px', borderRadius: '100px' }}
              >
                Write
              </Link>
              <Link to={`/login?next=${encodeURIComponent(nextPath)}`}>Login</Link>
              <Link to={`/register?next=${encodeURIComponent(nextPath)}`}>Sign Up</Link>
            </>
          ) : (
            <div className="auth-actions">
              <Link to="/create" className="btn-primary" style={{ padding: '8px 24px', fontSize: '14px', borderRadius: '100px' }}>Write</Link>
              
              <div className="notification-wrapper" style={{ position: 'relative' }}>
                <button 
                  onClick={toggleNotifications}
                  className="notification-bell"
                  style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', fontSize: '22px', position: 'relative', display: 'flex', alignItems: 'center' }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="dropdown-header">Notifications</div>
                    <div className="dropdown-body">
                      {notifications.length === 0 ? (
                        <div className="empty-notification">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n._id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                            <div className="notification-content">
                              <strong>{n.sender?.username}</strong> {
                                n.type === 'like' ? 'liked your post' : 
                                n.type === 'comment' ? 'commented on your post' : 
                                'started following you'
                              }
                              {n.post && (
                                <Link to={`/post/${n.post.slug}`} onClick={() => setShowNotifications(false)}>
                                  <div className="notification-target">"{n.post.title}"</div>
                                </Link>
                              )}
                              <div className="notification-time">{new Date(n.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to={`/profile/${user.id || user._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{user.username}</span>
              </Link>
              <Link to="/settings" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '18px' }} title="Settings">⚙️</Link>
              <button onClick={logout} className="btn-logout">
                <span>Logout</span>
                <span>🚪</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
