import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const Featured = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const onCardClick =
    (slug: string) =>
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('a')) return;
      navigate(`/post/${slug}`);
    };
  const onCardKeyDown =
    (slug: string) =>
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(`/post/${slug}`);
      }
    };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Fetch posts sorted by views as "Featured"
        const res = await api.get('/posts?sort=views&limit=6');
        setPosts(res.data.posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="featured-page">
      <Helmet>
        <title>Featured Stories | BlogMax</title>
      </Helmet>
      
      <div className="container" style={{ paddingBottom: '100px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-section"
        >
          <h1 className="auth-title">Featured Stories</h1>
          <p className="auth-subtitle">The most popular and trending stories from our top creators.</p>
        </motion.div>

        {loading ? (
          <div className="loading-state">Loading featured content...</div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <motion.div 
                key={post._id}
                whileHover={{ y: -10 }}
                className="post-card"
                role="link"
                tabIndex={0}
                onClick={onCardClick(post.slug)}
                onKeyDown={onCardKeyDown(post.slug)}
                style={{ cursor: 'pointer', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}
              >
                <Link to={`/post/${post.slug}`}>
                  <div className="post-img-wrapper">
                    <img src={post.image || 'https://via.placeholder.com/600x400'} alt={post.title} className="post-img" />
                    <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--primary)', color: 'var(--btn-text)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 'bold' }}>
                      TRENDING
                    </div>
                  </div>
                </Link>
                <div className="post-content">
                  <span className="post-category" style={{ color: 'var(--primary)' }}>{post.category?.name || post.category}</span>
                  <Link to={`/post/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 className="post-title">{post.title}</h3>
                  </Link>
                  <p className="post-excerpt" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                    {post.summary || post.excerpt}
                  </p>
                  <div className="post-meta" style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {post.author?.username}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>👁️ {post.views}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Featured;
