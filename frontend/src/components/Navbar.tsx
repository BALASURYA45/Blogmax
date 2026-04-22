import { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { Bell, Home as HomeIcon, LogIn, LogOut, Menu, Moon, Plus, Settings, Sun, User as UserIcon, UserPlus, X } from 'lucide-react';
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
  const [navHidden, setNavHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;
  const nextPath = `${location.pathname}${location.search}`;
  const socketBaseUrl =
    import.meta.env.VITE_SOCKET_URL ||
    (import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
      : (import.meta.env.DEV ? 'http://localhost:5000' : 'https://blogmax-k21q.onrender.com'));
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (menuOpen) return;
      if (tickingRef.current) return;
      tickingRef.current = true;

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY || 0;
        const lastY = lastScrollYRef.current;
        const delta = currentY - lastY;

        // Keep visible near top.
        if (currentY < 30) {
          setNavHidden(false);
        } else if (Math.abs(delta) > 10) {
          // Hide when scrolling down, show when scrolling up.
          if (delta > 0) setNavHidden(true);
          else setNavHidden(false);
        }

        lastScrollYRef.current = currentY;
        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll as any);
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.classList.toggle('nav-hidden', navHidden && !menuOpen);
  }, [navHidden, menuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    // Close menu on route change
    setMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    // Ensure navbar is visible when menu is open.
    setNavHidden(false);

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        setMenuOpen(false);
        setShowNotifications(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

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

  const effectiveNavHidden = navHidden && !menuOpen;
  const portalRoot = typeof document !== 'undefined' ? document.body : null;

  return (
    <nav className={`navbar ${effectiveNavHidden ? 'navbar--hidden' : ''}`}>
      <div className="container">
        <Link to="/" className="nav-logo">BlogMax</Link>

        <button
          type="button"
          className="nav-menu-btn nav-icon-btn nav-icon-btn--premium"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          title={menuOpen ? 'Close' : 'Menu'}
          onClick={() => setMenuOpen((p) => !p)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Desktop icons (keeps current layout) */}
        <div className="nav-links nav-links--desktop">
          <Link to="/" className="nav-icon-btn nav-icon-btn--premium" title="Home" aria-label="Home">
            <HomeIcon size={18} />
          </Link>
          <button
            onClick={toggleTheme}
            className={`theme-toggle ${theme}`}
            title={`Switch to ${theme === 'black' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
            type="button"
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
              <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="nav-text-link">Login</Link>
              <Link to={`/register?next=${encodeURIComponent(nextPath)}`} className="nav-text-link">Sign Up</Link>
            </>
          ) : (
            <div className="auth-actions">
              <Link to="/create" className="nav-icon-btn nav-icon-btn--premium nav-icon-btn--gold" title="Create" aria-label="Create post">
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
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
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
                              <strong>{n.sender?.username}</strong>{' '}
                              {n.type === 'like'
                                ? 'liked your post'
                                : n.type === 'comment'
                                ? 'commented on your post'
                                : n.type === 'mention'
                                ? 'mentioned you in a comment'
                                : n.type === 'reaction'
                                ? 'reacted to your comment'
                                : n.type === 'post'
                                ? 'published a new post'
                                : 'started following you'}
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

              <Link to={`/profile/${user.id || user._id}`} className="nav-icon-btn nav-icon-btn--premium" title={user.username} aria-label="Profile">
                <UserIcon size={18} />
              </Link>
              <Link to="/settings" className="nav-icon-btn nav-icon-btn--premium" title="Settings" aria-label="Settings">
                <Settings size={18} />
              </Link>
              <button onClick={logout} className="btn-logout btn-logout--premium btn-logout--icon" type="button" title="Logout" aria-label="Logout">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {menuOpen && portalRoot
          ? createPortal(
              <div className="nav-drawer-overlay" role="dialog" aria-modal="true" aria-label="Navigation menu">
                <div className="nav-drawer" ref={(el) => { drawerRef.current = el; }}>
                  <div className="nav-drawer-header">
                    <span className="nav-drawer-title">Menu</span>
                    <button
                      type="button"
                      className="nav-icon-btn nav-icon-btn--premium"
                      aria-label="Close menu"
                      onClick={() => setMenuOpen(false)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="nav-drawer-list">
                    <Link to="/" className="nav-drawer-item" aria-label="Home">
                      <HomeIcon size={18} />
                      <span>Home</span>
                    </Link>

                    <button type="button" className="nav-drawer-item" onClick={toggleTheme} aria-label="Toggle theme">
                      {theme === 'black' ? <Sun size={18} /> : <Moon size={18} />}
                      <span>{theme === 'black' ? 'Light mode' : 'Dark mode'}</span>
                    </button>

                    <Link to={user ? '/create' : `/login?next=${encodeURIComponent('/create')}`} className="nav-drawer-item" aria-label="Create post">
                      <Plus size={18} />
                      <span>Create</span>
                    </Link>

                    {user ? (
                      <>
                        <div className="nav-drawer-notifications">
                          <button
                            type="button"
                            className="nav-drawer-item"
                            onClick={toggleNotifications}
                            aria-label="Notifications"
                          >
                            <span style={{ position: 'relative', display: 'inline-flex' }}>
                              <Bell size={18} />
                              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                            </span>
                            <span>Notifications</span>
                          </button>

                          {showNotifications && (
                            <div className="nav-drawer-notification-panel">
                              {notifications.length === 0 ? (
                                <div className="empty-notification">No notifications yet</div>
                              ) : (
                                notifications.map((n) => (
                                  <div key={n._id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                                    <div className="notification-content">
                                      <strong>{n.sender?.username}</strong>{' '}
                                      {n.type === 'like'
                                        ? 'liked your post'
                                        : n.type === 'comment'
                                        ? 'commented on your post'
                                        : n.type === 'mention'
                                        ? 'mentioned you'
                                        : n.type === 'reaction'
                                        ? 'reacted to your comment'
                                        : n.type === 'post'
                                        ? 'published a new post'
                                        : 'followed you'}
                                      {n.post && (
                                        <Link to={`/post/${n.post.slug}`} onClick={() => setMenuOpen(false)}>
                                          <div className="notification-target">"{n.post.title}"</div>
                                        </Link>
                                      )}
                                      <div className="notification-time">{new Date(n.createdAt).toLocaleDateString()}</div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        <Link to={`/profile/${user.id || user._id}`} className="nav-drawer-item" aria-label="Profile">
                          <UserIcon size={18} />
                          <span>Profile</span>
                        </Link>
                        <Link to="/settings" className="nav-drawer-item" aria-label="Settings">
                          <Settings size={18} />
                          <span>Settings</span>
                        </Link>
                        <button type="button" className="nav-drawer-item nav-drawer-item--danger" onClick={logout} aria-label="Logout">
                          <LogOut size={18} />
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to={`/login?next=${encodeURIComponent(nextPath)}`} className="nav-drawer-item" aria-label="Login">
                          <LogIn size={18} />
                          <span>Login</span>
                        </Link>
                        <Link to={`/register?next=${encodeURIComponent(nextPath)}`} className="nav-drawer-item" aria-label="Sign up">
                          <UserPlus size={18} />
                          <span>Sign Up</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>,
              portalRoot
            )
          : null}
      </div>
    </nav>
  );
};

export default Navbar;
