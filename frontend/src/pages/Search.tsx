import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import '../App.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        let url = `/posts?search=${query}`;
        if (selectedCategory) url += `&category=${selectedCategory}`;
        if (sortBy === 'views') url += `&sort=views`;
        
        const res = await api.get(url);
        setPosts(res.data.posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, selectedCategory, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newQuery = formData.get('search') as string;
    setSearchParams({ q: newQuery });
  };

  return (
    <div className="container" style={{ padding: '60px 20px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '48px' }}
      >
        <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '24px' }}>
          Search results for "{query}"
        </h1>
        
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
          <input 
            name="search"
            type="text" 
            defaultValue={query}
            placeholder="Search stories..." 
            className="form-input"
            style={{ flex: 1, color: 'var(--text-color)' }}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '40px' }}>
        {/* Filters Sidebar */}
        <aside>
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '700' }}>Sort By</h3>
            <select 
              className="form-input" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '700' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => setSelectedCategory('')}
                style={{ 
                  textAlign: 'left', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  background: selectedCategory === '' ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  color: selectedCategory === '' ? 'var(--btn-text)' : 'var(--text-color)',
                  cursor: 'pointer'
                }}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button 
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  style={{ 
                    textAlign: 'left', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    background: selectedCategory === cat._id ? 'var(--primary)' : 'transparent',
                    border: 'none',
                    color: selectedCategory === cat._id ? 'var(--btn-text)' : 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Searching...</div>
          ) : posts.length > 0 ? (
            <div className="posts-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {posts.map((post, index) => (
                <motion.div 
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="post-card"
                >
                  {post.featuredImage && (
                    <div className="post-img-wrapper" style={{ height: '180px' }}>
                      <img src={post.featuredImage} alt={post.title} className="post-img" />
                    </div>
                  )}
                  <div className="post-content">
                    <span className="post-category">{post.category?.name}</span>
                    <h2 className="post-title" style={{ fontSize: '20px' }}>
                      <Link to={`/post/${post.slug}`}>{post.title}</Link>
                    </h2>
                    <div className="post-meta" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: 'var(--btn-text)' }}>
                          {post.author?.username?.[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {post.author?.username}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(post.createdAt).toLocaleDateString()} • {post.views || 0} views
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
              <h3>No stories found matching your search.</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try different keywords or filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Search;
