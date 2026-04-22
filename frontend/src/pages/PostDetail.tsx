import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequireAuthModal from '../components/RequireAuthModal';
import SafeImage from '../components/SafeImage';
import { Flame, Heart, Laugh, ThumbsUp } from 'lucide-react';
import '../App.css';

const PostDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const hasIncrementedView = useRef(false);
  const [authPrompt, setAuthPrompt] = useState<{ open: boolean; title?: string; description?: string }>({
    open: false
  });

  const nextPath = `${location.pathname}${location.search}`;
  const resolvePostImage = (p: any) => p?.featuredImage || p?.image || '';
  const requireAuth = (title: string, description: string) => {
    setAuthPrompt({ open: true, title, description });
  };

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        const postRes = await api.get(`/posts/${slug}`);
        const postData = postRes.data;
        setPost(postData);
        
        if (user && postData.likes) {
          setIsLiked(postData.likes.includes(user.id || user._id));
        }

        // Check bookmark status
        if (user) {
          try {
            const bookmarksRes = await api.get('/users/bookmarks');
            const bookmarked = bookmarksRes.data.some((b: any) => (b._id || b) === postData._id);
            setIsBookmarked(bookmarked);
          } catch (e) {
            console.error("Error checking bookmark status", e);
          }
        }

        // Increment view once
        if (!hasIncrementedView.current) {
          hasIncrementedView.current = true;
          try {
            await api.post(`/posts/${postData._id}/view`);
            // Update local state views count
            setPost((prev: any) => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
          } catch (e) {
            console.error("Error incrementing view", e);
          }
        }

        // Check following status
        if (user && postData.author) {
          const authorId = postData.author._id || postData.author;
          try {
            const profileRes = await api.get(`/users/profile/${authorId}`);
            const isFollowed = profileRes.data.user.followers.some((f: any) => (f._id || f) === (user.id || user._id));
            setIsFollowing(isFollowed);
          } catch (e) {
            console.error("Error checking follow status", e);
          }
        }

        // Fetch comments using the actual post ID
        const commentsRes = await api.get(`/comments/${postData._id}`);
        setComments(commentsRes.data);

        // Fetch related posts
        try {
          try {
            const similarRes = await api.get(`/posts/${postData.slug}/similar?limit=3`);
            setRelatedPosts(similarRes.data || []);
          } catch {
            const categoryId = postData.category?._id || postData.category;
            const relatedRes = await api.get(`/posts/related?categoryId=${categoryId}&currentPostId=${postData._id}`);
            setRelatedPosts(relatedRes.data);
          }
        } catch (e) {
          console.error("Error fetching related posts", e);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();
  }, [slug, user]);

  const handleLike = async () => {
    if (!user) return requireAuth('Login to like', 'Sign in or register to like this story.');
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setPost({ ...post, likes: res.data });
      setIsLiked(res.data.includes(user.id || user._id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    if (!user) return requireAuth('Login to save', 'Sign in or register to save this story to your reading list.');
    try {
      await api.post(`/users/bookmark/${post._id}`);
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleFollow = async () => {
    if (!user) return requireAuth('Login to follow', 'Sign in or register to follow this author.');
    try {
      const authorId = post.author?._id || post.author;
      const res = await api.post(`/users/follow/${authorId}`);
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!user) return requireAuth('Login to comment', 'Sign in or register to join the discussion.');
    
    const content = parentId ? (e.target as any).replyContent.value : comment;
    if (!content.trim()) return;

    try {
      const res = await api.post('/comments', {
        content: content,
        postId: post._id,
        parentCommentId: parentId
      });
      
      if (parentId) {
        // Refresh comments to show the new reply in the thread
        const commentsRes = await api.get(`/comments/${post._id}`);
        setComments(commentsRes.data);
        setReplyingTo(null);
      } else {
        setComments([{ ...res.data, replies: [] }, ...comments]);
        setComment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateCommentTree = (items: any[], commentId: string, updater: (c: any) => any): any[] => {
    return items.map((c) => {
      if (c._id === commentId) return updater(c);
      if (c.replies?.length) {
        return { ...c, replies: updateCommentTree(c.replies, commentId, updater) };
      }
      return c;
    });
  };

  const handleReact = async (commentId: string, emoji: string) => {
    if (!user) return requireAuth('Login to react', 'Sign in or register to react to comments.');
    try {
      const res = await api.post(`/comments/${commentId}/react`, { emoji });
      setComments((prev) => updateCommentTree(prev, commentId, (c) => ({ ...c, reactions: res.data.reactions })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.delete(`/posts/${post._id}`);
        navigate('/');
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return (
    <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
        Fetching story...
      </motion.div>
    </div>
  );
  
  if (!post) return <div className="post-detail">Post not found</div>;

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const readingTime = calculateReadingTime(post.content);
  const isAuthor = user && (user._id === post.author?._id || user._id === post.author);
  const isAdmin = user && user.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <RequireAuthModal
        open={authPrompt.open}
        onClose={() => setAuthPrompt({ open: false })}
        nextPath={nextPath}
        title={authPrompt.title}
        description={authPrompt.description}
      />
      <Helmet>
        <title>{post.title} | BlogMax</title>
        <meta name="description" content={post.excerpt || post.summary} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.summary} />
        <meta property="og:image" content={resolvePostImage(post)} />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="article" />
        <meta property="article:author" content={post.author?.username} />
        <meta property="article:published_time" content={post.createdAt} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt || post.summary} />
        <meta name="twitter:image" content={resolvePostImage(post)} />
      </Helmet>
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: `${readingProgress}%`, 
          height: '4px', 
          background: 'var(--primary)', 
          zIndex: 9999,
          transition: 'width 0.1s ease-out'
        }} 
      />
      <header className="post-detail-header post-detail-header--stacked">
        <div className="container">
          <div className="post-detail-hero">
            <SafeImage src={resolvePostImage(post)} alt={post.title} className="post-detail-hero-img" />
          </div>
        </div>
        <div className="container post-detail-hero-content">
          <motion.div 
            initial={{ y: 30, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.3 }}
          >
            <div className="post-detail-info-card">
              <div className="post-detail-topline">
                <span className="badge">{post.category?.name}</span>
                {canEdit && (
                  <div className="post-detail-actions">
                    <Link to={`/edit/${post.slug}`} className="btn-edit">Edit Story</Link>
                    <button onClick={handleDelete} className="btn-delete">Delete</button>
                  </div>
                )}
              </div>

              <h1 className="post-detail-title">{post.title}</h1>

              <div className="post-header-meta post-detail-meta">
                <div className="post-detail-meta-row">
                  <Link to={`/profile/${post.author?._id || post.author}`} className="post-detail-author">
                    <div className="post-detail-avatar">
                      {post.author?.username[0].toUpperCase()}
                    </div>
                    <div className="post-detail-author-text">
                      <div className="post-detail-author-name">{post.author?.username}</div>
                      <div className="post-detail-author-stats">
                        <span>{new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                        <span className="dot">{'\u2022'}</span>
                        <span>{readingTime} min read</span>
                        <span className="dot">{'\u2022'}</span>
                        <span>{post.views || 0} views</span>
                        <span className="dot">{'\u2022'}</span>
                        <span>{post.likes?.length || 0} likes</span>
                      </div>
                    </div>
                  </Link>

                  {user && (user.id || user._id) !== (post.author?._id || post.author) && (
                    <button 
                      onClick={handleFollow}
                      className={isFollowing ? 'btn-secondary post-detail-follow' : 'btn-primary post-detail-follow'}
                      type="button"
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="post-detail" style={{ marginTop: 0 }}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.5 }}
          className="post-body" 
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
        
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          className="interactions-section"
          style={{ display: 'flex', gap: '20px', alignItems: 'center' }}
        >
          <button 
            onClick={handleLike} 
            className={`like-button ${isLiked ? 'liked' : ''}`}
          >
            <span className="like-icon">{isLiked ? '❤️' : '🤍'}</span>
            <span className="like-count">{post.likes?.length || 0} Likes</span>
          </button>

          <button 
            onClick={handleBookmark} 
            className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
            style={{ 
              background: isBookmarked ? 'var(--primary)' : 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: isBookmarked ? 'var(--btn-text)' : 'var(--text-color)',
              padding: '10px 24px',
              borderRadius: '100px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)',
              fontWeight: '600'
            }}
          >
            <span>{isBookmarked ? '🔖' : '🔖'}</span>
            <span>{isBookmarked ? 'Saved' : 'Save Story'}</span>
          </button>

          <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
            <button 
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${post.title}&url=${window.location.href}`, '_blank')}
              style={{ background: 'rgba(29, 161, 242, 0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1da1f2' }}
              title="Share on Twitter"
            >
              🐦
            </button>
            <button 
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${window.location.href}`, '_blank')}
              style={{ background: 'rgba(0, 119, 181, 0.1)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0077b5' }}
              title="Share on LinkedIn"
            >
              🔗
            </button>
            <button 
              onClick={handleCopyLink}
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0 16px', borderRadius: '100px', cursor: 'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
            >
              {copySuccess ? '✅ Copied' : '📋 Copy Link'}
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          className="tags-section"
        >
          <h3 style={{ fontSize: '24px', fontWeight: '700' }}>Tags</h3>
          <div className="tag-list">
            {post.tags.map((tag: string) => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          className="comments-section"
        >
          <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>Comments ({comments.length})</h3>
          
          {user ? (
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                placeholder="Add to the discussion..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="comment-input"
                required
              />
              <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 24px' }}>
                Comment
              </button>
            </form>
          ) : (
            <div
              style={{
                border: '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                borderRadius: '20px',
                padding: '18px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Sign in to comment or reply.</div>
              <button
                className="btn-primary"
                style={{ padding: '10px 18px', borderRadius: '100px' }}
                onClick={() => requireAuth('Login to comment', 'Sign in or register to join the discussion.')}
              >
                Login / Register
              </button>
            </div>
          )}

          <div className="comment-list">
            {comments.map((c: any) => (
              <CommentItem 
                key={c._id} 
                comment={c} 
                user={user} 
                onReact={handleReact}
                onReply={(id: string) => setReplyingTo(id)} 
                replyingTo={replyingTo}
                onReplySubmit={handleCommentSubmit}
              />
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          className="related-section"
          style={{ marginTop: '80px', paddingTop: '80px', borderTop: '1px solid var(--border-color)' }}
        >
          <h3 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '40px' }}>Related Stories</h3>
          <div className="posts-grid">
            {relatedPosts.map((rp) => (
              <Link to={`/post/${rp.slug}`} key={rp._id} className="post-card-link">
                <div className="post-card">
                  <div className="post-card-image" style={{ height: '200px' }}>
                    <SafeImage
                      src={resolvePostImage(rp)}
                      alt={rp.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      fallback={<div className="img-fallback">No image</div>}
                    />
                  </div>
                  <div className="post-card-content" style={{ padding: '24px' }}>
                    <span className="badge" style={{ fontSize: '10px' }}>{rp.category?.name}</span>
                    <h4 style={{ fontSize: '18px', margin: '12px 0' }}>{rp.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>{rp.author?.username}</span>
                      <span>•</span>
                      <span>{new Date(rp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {relatedPosts.length === 0 && (
              <p style={{ color: 'var(--text-secondary)' }}>No related stories found.</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const renderMentions = (text: string) => {
  const parts = text.split(/(@[a-zA-Z0-9_]{3,30})/g);
  return parts.map((p, idx) => {
    if (/^@[a-zA-Z0-9_]{3,30}$/.test(p)) {
      return (
        <span key={idx} style={{ color: '#06b6d4', fontWeight: 800 }}>
          {p}
        </span>
      );
    }
    return <span key={idx}>{p}</span>;
  });
};

const CommentItem = ({ comment, user, onReact, onReply, replyingTo, onReplySubmit }: any) => {
  const currentUserId = user?.id || user?._id;
  const reactions = comment.reactions || [];
  const hasReacted = (emoji: string) => {
    const r = reactions.find((x: any) => x.emoji === emoji);
    return !!r?.users?.some((u: any) => (u._id || u).toString() === currentUserId?.toString());
  };

  const reactionOptions = [
    { emoji: '👍', label: 'Like', Icon: ThumbsUp },
    { emoji: '❤️', label: 'Love', Icon: Heart },
    { emoji: '😂', label: 'Laugh', Icon: Laugh },
    { emoji: '🔥', label: 'Fire', Icon: Flame }
  ];

  return (
    <div className="comment-card" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <Link to={`/profile/${comment.author?._id || comment.author}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
            {comment.author?.username[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>{comment.author?.username}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Link>
      </div>
      <p style={{ color: 'var(--text-color)', lineHeight: '1.6', marginBottom: '12px' }}>{renderMentions(comment.content || '')}</p>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="comment-reactions">
          {reactionOptions.map(({ emoji, label, Icon }) => {
            const active = !!user && hasReacted(emoji);
            const count = reactions.find((x: any) => x.emoji === emoji)?.users?.length || 0;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(comment._id, emoji)}
                title={active ? `Remove ${label}` : label}
                aria-label={active ? `Remove ${label} reaction` : `Add ${label} reaction`}
                className={`comment-reaction-btn ${active ? 'comment-reaction-btn--active' : ''}`}
              >
                <span className="comment-reaction-icon" aria-hidden="true">
                  <Icon size={16} />
                </span>
                {count > 0 && <span className="comment-reaction-count">{count}</span>}
              </button>
            );
          })}
        </div>
        {user && (
          <button 
            onClick={() => onReply(replyingTo === comment._id ? null : comment._id)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}
          >
            {replyingTo === comment._id ? 'Cancel' : 'Reply'}
          </button>
        )}
      </div>

      {replyingTo === comment._id && (
        <form onSubmit={(e) => onReplySubmit(e, comment._id)} className="comment-form" style={{ marginTop: '16px' }}>
          <textarea
            name="replyContent"
            placeholder="Write a reply..."
            className="comment-input"
            required
            autoFocus
          />
          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 20px', fontSize: '13px' }}>
            Post Reply
          </button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: '44px', marginTop: '16px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px' }}>
          {comment.replies.map((reply: any) => (
            <CommentItem 
              key={reply._id} 
              comment={reply} 
              user={user} 
              onReact={onReact}
              onReply={onReply} 
              replyingTo={replyingTo}
              onReplySubmit={onReplySubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostDetail;
