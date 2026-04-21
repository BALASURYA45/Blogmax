import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import '../App.css';

const Authors = () => {
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const res = await api.get('/users/authors');
        setAuthors(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  return (
    <div className="authors-page">
      <Helmet>
        <title>Authors | BlogMax</title>
      </Helmet>
      
      <div className="container" style={{ paddingBottom: '100px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-section"
        >
          <h1 className="auth-title">Meet Our Authors</h1>
          <p className="auth-subtitle">Discover the people behind our most inspiring stories.</p>
        </motion.div>

        {loading ? (
          <div className="loading-state">Loading authors...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px', marginTop: '40px' }}>
            {authors.map((author) => (
              <motion.div 
                key={author._id}
                whileHover={{ y: -10 }}
                className="author-card"
                style={{ 
                  background: 'var(--surface-color)', 
                  padding: '40px', 
                  borderRadius: '24px', 
                  border: '1px solid var(--glass-border)',
                  textAlign: 'center'
                }}
              >
                <img 
                  src={author.avatar || 'https://via.placeholder.com/150'} 
                  alt={author.username} 
                  style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '20px', border: '3px solid var(--primary)' }}
                />
                <h3 style={{ color: 'var(--text-color)', fontSize: '22px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {author.username}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px', minHeight: '42px' }}>
                  {author.bio || 'Sharing creative insights and professional stories on BlogMax.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', color: 'var(--primary-bright)', fontSize: '14px', fontWeight: '600' }}>
                  <span>{author.followersCount ?? author.followers?.length ?? 0} Followers</span>
                </div>
                <Link to={`/profile/${author._id}`} className="btn-primary" style={{ textDecoration: 'none', display: 'block' }}>
                  View Profile
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Authors;
