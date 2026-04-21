import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../App.css';

const LatestStories = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get('/posts?limit=12');
        setPosts(res.data.posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="latest-stories-page">
      <Helmet>
        <title>Latest Stories | BlogMax</title>
      </Helmet>
      
      <div className="container" style={{ paddingBottom: '100px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-section"
        >
          <h1 className="auth-title">Latest Stories</h1>
          <p className="auth-subtitle">Discover the most recent insights from our community.</p>
        </motion.div>

        {loading ? (
          <div className="loading-state">Loading stories...</div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <motion.div 
                key={post._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="post-card"
              >
                <Link to={`/post/${post.slug}`}>
                  <div className="post-img-wrapper">
                    <img src={post.image || 'https://via.placeholder.com/600x400'} alt={post.title} className="post-img" />
                  </div>
                </Link>
                <div className="post-content">
                  <span className="post-category">{post.category}</span>
                  <Link to={`/post/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 className="post-title">{post.title}</h3>
                  </Link>
                  <p className="post-excerpt" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                    {post.summary}
                  </p>
                  <div className="post-meta" style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <span>{post.author?.username}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
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

export default LatestStories;
