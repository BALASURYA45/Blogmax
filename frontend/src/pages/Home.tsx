import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SafeImage from '../components/SafeImage';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [forYouPosts, setForYouPosts] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const fetchPosts = async (query = '', pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await api.get(`/posts?search=${query}&page=${pageNum}&limit=6`);
      const newPosts = res.data.posts;
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setHasMore(pageNum < res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        setLoadingDiscovery(true);
        const [forYouRes, trendingRes] = await Promise.all([
          user ? api.get('/posts/for-you?limit=6') : Promise.resolve({ data: { posts: [] } } as any),
          api.get('/posts/trending?limit=6&days=14')
        ]);
        setForYouPosts(forYouRes.data?.posts || []);
        setTrendingPosts(trendingRes.data?.posts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDiscovery(false);
      }
    };
    fetchDiscovery();
  }, [user]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(searchQuery, nextPage, true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
      Loading the future...
    </motion.div>
  </div>;

  const featuredPost: any = posts[0];
  const remainingPosts = posts.slice(1);
  const resolvePostImage = (post: any) => post?.featuredImage || post?.image || '';
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

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 1 }}
      className="container"
    >
      <Helmet>
        <title>BlogMax | The Art of Digital Storytelling</title>
        <meta name="description" content="A premium blogging platform for builders, designers, and visionaries." />
      </Helmet>
      {/* Hero Section */}
      <section className="hero-section">
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: '72px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-3px', lineHeight: '1' }}
        >
          The Art of <span style={{ color: 'var(--primary-bright)' }}>Digital</span> Storytelling.
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ color: 'var(--text-secondary)', fontSize: '20px', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6', marginBottom: '40px' }}
        >
          A premium space for builders, designers, and visionaries to share insights that define the next generation of the web.
        </motion.p>

        {/* Search Bar */}
        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onSubmit={handleSearch}
          className="search-container"
        >
          <input 
            type="text" 
            placeholder="Search stories by title or content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </motion.form>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <motion.section 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="featured-post"
        >
          <div className="featured-img-wrapper">
            <SafeImage
              src={resolvePostImage(featuredPost)}
              alt={featuredPost.title}
              className="featured-img"
              fallback={<div className="img-fallback">No image</div>}
            />
          </div>
          <div className="featured-content">
            <span className="badge">Featured Story</span>
            <h2 style={{ fontSize: '40px', fontWeight: '800', margin: '20px 0', lineHeight: '1.2', color: 'var(--text-color)' }}>{featuredPost.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--btn-text)', fontSize: '14px' }}>
                {featuredPost.author?.username?.[0].toUpperCase()}
              </div>
              <span style={{ color: 'var(--text-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {featuredPost.author?.username}
                
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '24px' }}>{featuredPost.excerpt}</p>
            <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
              <span>{new Date(featuredPost.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <span>{featuredPost.views || 0} views</span>
              <span>•</span>
              <span>{featuredPost.likes?.length || 0} likes</span>
            </div>
            <Link to={`/post/${featuredPost.slug}`} className="btn-primary" style={{ display: 'inline-block' }}>Read Full Story</Link>
          </div>
        </motion.section>
      )}

      {/* Discovery Sections */}
      {!loadingDiscovery && (
        <div style={{ marginTop: '64px', marginBottom: '18px', display: 'grid', gap: '28px' }}>
          {user && forYouPosts.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', color: 'var(--text-color)' }}>For You</h2>
                <Link to="/latest" style={{ color: 'var(--primary-bright)', fontWeight: 700, fontSize: '14px' }}>
                  Explore {'\u2192'}
                </Link>
              </div>
              <div className="posts-grid">
                {forYouPosts.slice(0, 6).map((post: any, index: number) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="post-card"
                    role="link"
                    tabIndex={0}
                    onClick={onCardClick(post.slug)}
                    onKeyDown={onCardKeyDown(post.slug)}
                    style={{ cursor: 'pointer' }}
                  >
                    {resolvePostImage(post) && (
                      <div className="post-img-wrapper">
                        <SafeImage src={resolvePostImage(post)} alt={post.title} className="post-img" fallback={<div className="img-fallback">No image</div>} />
                      </div>
                    )}
                    <div className="post-content">
                      <span className="post-category">{post.category?.name}</span>
                      <h2 className="post-title">
                        <Link to={`/post/${post.slug}`}>{post.title}</Link>
                      </h2>
                      <p className="post-excerpt">{post.excerpt}</p>
                      <div className="post-meta">
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} â€¢ {post.views || 0} views â€¢ {post.likes?.length || 0} likes
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {trendingPosts.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', color: 'var(--text-color)' }}>Trending</h2>
                <Link to="/featured" style={{ color: 'var(--primary-bright)', fontWeight: 700, fontSize: '14px' }}>
                  See more {'\u2192'}
                </Link>
              </div>
              <div className="posts-grid">
                {trendingPosts.slice(0, 6).map((post: any, index: number) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="post-card"
                    role="link"
                    tabIndex={0}
                    onClick={onCardClick(post.slug)}
                    onKeyDown={onCardKeyDown(post.slug)}
                    style={{ cursor: 'pointer' }}
                  >
                    {resolvePostImage(post) && (
                      <div className="post-img-wrapper">
                        <SafeImage src={resolvePostImage(post)} alt={post.title} className="post-img" fallback={<div className="img-fallback">No image</div>} />
                      </div>
                    )}
                    <div className="post-content">
                      <span className="post-category">{post.category?.name}</span>
                      <h2 className="post-title">
                        <Link to={`/post/${post.slug}`}>{post.title}</Link>
                      </h2>
                      <p className="post-excerpt">{post.excerpt}</p>
                      <div className="post-meta">
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} â€¢ {post.views || 0} views â€¢ {post.likes?.length || 0} likes
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Recent Stories Grid */}
      {posts.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1px', color: 'var(--text-color)' }}>Recent Stories</h2>
          </div>

          <div className="posts-grid">
            {remainingPosts.map((post: any, index: number) => (
              <motion.div 
                key={post._id} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="post-card"
                role="link"
                tabIndex={0}
                onClick={onCardClick(post.slug)}
                onKeyDown={onCardKeyDown(post.slug)}
                style={{ cursor: 'pointer' }}
              >
                {resolvePostImage(post) && (
                  <div className="post-img-wrapper">
                    <SafeImage
                      src={resolvePostImage(post)}
                      alt={post.title}
                      className="post-img"
                      fallback={<div className="img-fallback">No image</div>}
                    />
                  </div>
                )}
                <div className="post-content">
                  <span className="post-category">{post.category?.name}</span>
                  <h2 className="post-title">
                    <Link to={`/post/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <div className="post-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: 'var(--btn-text)' }}>
                        {post.author?.username?.[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {post.author?.username}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span>{post.views || 0} views</span>
                      <span>•</span>
                      <span>{post.likes?.length || 0} likes</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '64px', marginBottom: '100px' }}>
              <button 
                onClick={loadMore} 
                disabled={loadingMore}
                className="btn-secondary"
                style={{ padding: '16px 48px', borderRadius: '32px', fontSize: '16px' }}
              >
                {loadingMore ? 'Loading more magic...' : 'Load More Stories'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
          <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>No stories found</h3>
          <p>Try adjusting your search keywords.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Home;
