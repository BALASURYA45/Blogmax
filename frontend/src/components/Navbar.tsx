import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Bell, Home as HomeIcon, LogOut, Moon, Plus, Settings, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import '../App.css';

type NotificationItem = {
  _id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'reaction' | 'post';
  read: boolean;
  createdAt: string;
  sender?: { username?: string; avatar?: string } | null;
  post?: { slug: string; title: string } | null;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;
  const nextPath = `${location.pathname}${location.search}`;
  const socketBaseUrl =
    import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
      : (import.meta.env.DEV ? 'http://localhost:5000' : 'https://blogmax-k21q.onrender.com'));

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
    const socket = io(socketBaseUrl); // Use your backend URL
    socket.emit('join', user.id || user._id);

    socket.on('notification', (notification: NotificationItem) => {
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
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next) markAsRead();
      return next;
    });
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-logo">BlogMax</Link>
        <div className="nav-links">
          <Link
            to="/"
            className="nav-icon-btn nav-icon-btn--premium"
            title="Home"
            aria-label="Home"
          >
            <HomeIcon size={18} />
          </Link>
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
                className="nav-icon-btn nav-icon-btn--premium nav-icon-btn--gold"
                title="Create"
                aria-label="Create post"
              >
                <Plus size={18} />
              </Link>
              <Link to={`/login?next=${encodeURIComponent(nextPath)}`}>Login</Link>
              <Link to={`/register?next=${encodeURIComponent(nextPath)}`}>Sign Up</Link>
            </>
          ) : (
            <div className="auth-actions">
              <Link
                to="/create"
                className="nav-icon-btn nav-icon-btn--premium nav-icon-btn--gold"
                title="Create"
                aria-label="Create post"
              >
                <Plus size={18} />
              </Link>
              
              <div className="notification-wrapper" style={{ position: 'relative' }}>
                <button 
                  onClick={toggleNotifications}
                  className={`notification-bell notification-bell--premium ${unreadCount > 0 ? 'notification-bell--active' : ''}`}
                  type="button"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
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
                                n.type === 'mention' ? 'mentioned you in a comment' :
                                n.type === 'reaction' ? 'reacted to your comment' :
                                n.type === 'post' ? 'published a new post' :
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

              <Link
                to={`/profile/${user.id || user._id}`}
                className="nav-icon-btn nav-icon-btn--premium"
                title={user.username}
                aria-label="Profile"
              >
                <UserIcon size={18} />
              </Link>
              <Link
                to="/settings"
                className="nav-icon-btn nav-icon-btn--premium"
                title="Settings"
                aria-label="Settings"
              >
                <Settings size={18} />
              </Link>
              <button
                onClick={logout}
                className="btn-logout btn-logout--premium btn-logout--icon"
                type="button"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
