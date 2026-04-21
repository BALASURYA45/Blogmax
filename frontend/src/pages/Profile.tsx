import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequireAuthModal from '../components/RequireAuthModal';
import SafeImage from '../components/SafeImage';
import '../App.css';

const PRESET_AVATARS = [
  { id: 'astronaut', label: 'Astronaut', url: '/avatars/astronaut.svg' },
  { id: 'ninja', label: 'Ninja', url: '/avatars/ninja.svg' },
  { id: 'robot', label: 'Robot', url: '/avatars/robot.svg' },
  { id: 'wizard', label: 'Wizard', url: '/avatars/wizard.svg' },
  { id: 'hacker', label: 'Hacker', url: '/avatars/hacker.svg' },
  { id: 'fox', label: 'Fox', url: '/avatars/fox.svg' },
  { id: 'owl', label: 'Owl', url: '/avatars/owl.svg' }
] as const;

const Profile = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'analytics'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    avatar: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      github: '',
      website: ''
    }
  });
  const [authPrompt, setAuthPrompt] = useState<{ open: boolean; title?: string; description?: string }>({
    open: false
  });

  const nextPath = `${location.pathname}${location.search}`;
  const resolvePostImage = (post: any) => post?.featuredImage || post?.image || '';
  const requireAuth = (title: string, description: string) => {
    setAuthPrompt({ open: true, title, description });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/profile/${id}`);
        setProfile(res.data.user);
        setPosts(res.data.posts);
        
        setEditForm({
          bio: res.data.user.bio || '',
          avatar: res.data.user.avatar || '',
          socialLinks: {
            twitter: res.data.user.socialLinks?.twitter || '',
            linkedin: res.data.user.socialLinks?.linkedin || '',
            github: res.data.user.socialLinks?.github || '',
            website: res.data.user.socialLinks?.website || ''
          }
        });
        if (currentUser && res.data.user.followers) {
          setIsFollowing(res.data.user.followers.some((f: any) => (f._id || f) === (currentUser.id || currentUser._id)));
        }

        const isOwn = currentUser && (currentUser.id || currentUser._id) === id;
        if (isOwn) {
          try {
            const [bookmarksRes, statsRes] = await Promise.all([
              api.get('/users/bookmarks'),
              api.get('/posts/stats')
            ]);
            setBookmarks(bookmarksRes.data);
            setStats(statsRes.data);
          } catch (e) {
            console.error("Error fetching private data", e);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return requireAuth('Login to follow', 'Sign in or register to follow this author.');
    try {
      const res = await api.post(`/users/follow/${id}`);
      setIsFollowing(res.data.isFollowing);
      setProfile({
        ...profile,
        followers: res.data.isFollowing 
          ? [...profile.followers, currentUser] 
          : profile.followers.filter((f: any) => (f._id || f) !== (currentUser.id || currentUser._id))
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', editForm);
      setProfile(res.data);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', padding: '100px' }}>Loading profile...</div>;
  if (!profile) return <div className="container" style={{ textAlign: 'center', padding: '100px' }}>User not found</div>;

  const isOwnProfile = currentUser && (currentUser.id || currentUser._id) === id;

  return (
    <div className="container" style={{ marginTop: '120px' }}>
      <RequireAuthModal
        open={authPrompt.open}
        onClose={() => setAuthPrompt({ open: false })}
        nextPath={nextPath}
        title={authPrompt.title}
        description={authPrompt.description}
      />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-header"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '24px',
          padding: '48px',
          border: '1px solid var(--border-color)',
          marginBottom: '48px',
          textAlign: 'center'
        }}
      >
        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          background: 'var(--primary)', 
          margin: '0 auto 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'var(--btn-text)'
        }}>
          {profile.avatar ? (
            <SafeImage
              src={profile.avatar}
              alt={profile.username}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              fallback={<span>{profile.username?.[0]?.toUpperCase()}</span>}
            />
          ) : (
            profile.username?.[0]?.toUpperCase()
          )}
        </div>
        {profile.role === 'admin' && (
          <div style={{ marginBottom: '16px' }}>
            <span className="badge" style={{ background: 'var(--danger)' }}>
              ADMIN
            </span>
          </div>
        )}
        <h1 style={{ fontSize: '32px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-color)' }}>
          {profile.username}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '600px', margin: '0 auto 24px' }}>
          {profile.bio || "This user hasn't added a bio yet."}
        </p>

        {profile.socialLinks && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            {profile.socialLinks.twitter && (
              <a href={profile.socialLinks.twitter.startsWith('http') ? profile.socialLinks.twitter : `https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Twitter</a>
            )}
            {profile.socialLinks.linkedin && (
              <a href={profile.socialLinks.linkedin.startsWith('http') ? profile.socialLinks.linkedin : `https://linkedin.com/in/${profile.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>LinkedIn</a>
            )}
            {profile.socialLinks.github && (
              <a href={profile.socialLinks.github.startsWith('http') ? profile.socialLinks.github : `https://github.com/${profile.socialLinks.github}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>GitHub</a>
            )}
            {profile.socialLinks.website && (
              <a href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Website</a>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '32px', color: 'var(--text-color)' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{posts.length}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Stories</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{profile.followers?.length || 0}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Followers</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{profile.following?.length || 0}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Following</div>
          </div>
        </div>

        {!isOwnProfile && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button 
              onClick={handleFollow}
              className={isFollowing ? 'btn-secondary' : 'btn-primary'}
              style={{ padding: '12px 32px', borderRadius: '30px' }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        )}

        {isOwnProfile && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-primary"
            style={{ padding: '12px 32px', borderRadius: '30px' }}
          >
            Edit Profile
          </button>
        )}

        {isEditing && (
          <form onSubmit={handleUpdateProfile} style={{ maxWidth: '600px', margin: '32px auto', textAlign: 'left' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>Avatar</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-color)', fontWeight: 800 }}>
                  {editForm.avatar ? (
                    <SafeImage
                      src={editForm.avatar}
                      alt="Avatar Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      fallback={<span>{profile.username?.[0]?.toUpperCase()}</span>}
                    />
                  ) : (
                    <span>{profile.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.4 }}>
                  Pick an avatar from the presets below.
                  <div style={{ marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '8px 14px', borderRadius: '999px', fontSize: '12px' }}
                      onClick={() => setEditForm({ ...editForm, avatar: '' })}
                    >
                      Use initials
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                  gap: '12px'
                }}
              >
                {PRESET_AVATARS.map((a) => {
                  const selected = editForm.avatar === a.url;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      title={a.label}
                      aria-label={a.label}
                      onClick={() => setEditForm({ ...editForm, avatar: a.url })}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        padding: 0,
                        overflow: 'hidden',
                        border: selected ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                        background: 'var(--glass-bg)',
                        boxShadow: selected ? '0 0 0 4px var(--glass-bg)' : 'none',
                        transition: 'var(--transition-smooth)',
                        cursor: 'pointer'
                      }}
                    >
                      <img src={a.url} alt={a.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>Bio</label>
              <textarea 
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="form-control"
                style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', color: 'var(--text-color)', minHeight: '100px' }}
                placeholder="Tell the world about yourself..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>Twitter</label>
                <input 
                  type="text"
                  value={editForm.socialLinks.twitter}
                  onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, twitter: e.target.value } })}
                  className="form-control"
                  style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', color: 'var(--text-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>LinkedIn</label>
                <input 
                  type="text"
                  value={editForm.socialLinks.linkedin}
                  onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, linkedin: e.target.value } })}
                  className="form-control"
                  style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', color: 'var(--text-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>GitHub</label>
                <input 
                  type="text"
                  value={editForm.socialLinks.github}
                  onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, github: e.target.value } })}
                  className="form-control"
                  style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', color: 'var(--text-color)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>Website</label>
                <input 
                  type="text"
                  value={editForm.socialLinks.website}
                  onChange={(e) => setEditForm({ ...editForm, socialLinks: { ...editForm.socialLinks, website: e.target.value } })}
                  className="form-control"
                  style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', color: 'var(--text-color)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px' }}>Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ flex: 1, padding: '12px', borderRadius: '12px' }}>Cancel</button>
            </div>
          </form>
        )}
      </motion.div>

      <div className="profile-content">
        <div className="tabs" style={{ display: 'flex', gap: '24px', marginBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('posts')}
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '12px 0', 
              color: activeTab === 'posts' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'posts' ? '2px solid var(--primary)' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            Published Stories ({posts.length})
          </button>
          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('bookmarks')}
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: '12px 0', 
                color: activeTab === 'bookmarks' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'bookmarks' ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Reading List ({bookmarks.length})
            </button>
          )}
          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('analytics')}
              style={{ 
                background: 'none', 
                border: 'none', 
                padding: '12px 0', 
                color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'analytics' ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Analytics
            </button>
          )}
        </div>

        {activeTab !== 'analytics' ? (
          <div className="posts-grid">
            {(activeTab === 'posts' ? posts : bookmarks).map((post) => (
              <Link to={`/post/${post.slug}`} key={post._id} className="post-card-link">
                <motion.div 
                  whileHover={{ y: -10 }}
                  className="post-card"
                >
                  <div className="post-card-image">
                    <SafeImage
                      src={resolvePostImage(post)}
                      alt={post.title}
                      fallback={<div className="img-fallback">No image</div>}
                    />
                  </div>
                  <div className="post-card-content">
                    <span className="badge">{post.category?.name || 'Story'}</span>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <div className="post-card-footer" style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{post.views || 0} views</span>
                      <span>•</span>
                      <span>{post.likes?.length || 0} likes</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
            {activeTab === 'posts' && posts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                No stories published yet.
              </div>
            )}
            {activeTab === 'bookmarks' && bookmarks.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                Your reading list is empty. Start exploring and save some stories!
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '24px' 
            }}
          >
            {[
              { label: 'Total Views', value: stats?.totalViews, icon: '👁️' },
              { label: 'Total Likes', value: stats?.totalLikes, icon: '❤️' },
              { label: 'Published Stories', value: stats?.publishedCount, icon: '📝' },
              { label: 'Drafts', value: stats?.draftCount, icon: '📁' },
              { label: 'Total Stories', value: stats?.totalPosts, icon: '📚' }
            ].map((stat, i) => (
              <div 
                key={i} 
                style={{ 
                  background: 'var(--surface-color)', 
                  padding: '32px', 
                  borderRadius: '24px', 
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                  color: 'var(--text-color)'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{stat.icon}</div>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '4px' }}>{stat.value || 0}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
