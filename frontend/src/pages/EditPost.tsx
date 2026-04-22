import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../services/api';
import RevisionHistoryModal from '../components/RevisionHistoryModal';
import '../App.css';

const EditPost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [serverSavedAt, setServerSavedAt] = useState<string | null>(null);
  const [serverSaveState, setServerSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [postId, setPostId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [localDraftMeta, setLocalDraftMeta] = useState<{ at: string; draft: any } | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const { slug } = useParams();
  const navigate = useNavigate();

  const localStorageKey = useMemo(() => (slug ? `post-draft-${slug}` : null), [slug]);
  const lastAutosaveRef = useRef<number>(0);
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, postRes] = await Promise.all([
          api.get('/categories'),
          api.get(`/posts/${slug}`)
        ]);
        
        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
        } else {
          setCategories([
            { _id: 'education', name: 'Education' },
            { _id: 'lifemotivation', name: 'Lifemotivation' },
            { _id: 'technology', name: 'Technology' }
          ] as any);
        }
        
        const post = postRes.data;
        setPostId(post._id);
        setTitle(post.title);
        setContent(post.content);
        setCategory(post.category?._id || post.category);
        setTags(post.tags.join(', '));
        setFeaturedImage(post.featuredImage);
        setStatus(post.status);

        // Crash recovery prompt: only after server version is loaded.
        if (localStorageKey) {
          const raw = localStorage.getItem(localStorageKey);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const draft = parsed?.draft || parsed; // backward compatible
              const at = parsed?.at || null;
              if (draft && (draft.title || draft.content || draft.tags || draft.featuredImage)) {
                setLocalDraftMeta({ at: at || new Date().toISOString(), draft });
                setShowRecovery(true);
              }
            } catch {
              // ignore
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  // Save draft locally (crash recovery) with debounce-friendly metadata.
  useEffect(() => {
    if (loading || !localStorageKey) return;
    const draft = { title, content, category, tags, featuredImage };
    localStorage.setItem(localStorageKey, JSON.stringify({ at: new Date().toISOString(), draft }));
    setLastSaved(new Date().toLocaleTimeString());
  }, [title, content, category, tags, featuredImage, loading, localStorageKey]);

  // Server autosave (draft safety) with debounce + version history.
  useEffect(() => {
    if (loading || !postId) return;

    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = window.setTimeout(async () => {
      const now = Date.now();
      if (now - lastAutosaveRef.current < 6000) return;
      lastAutosaveRef.current = now;

      try {
        setServerSaveState('saving');
        const res = await api.post(`/posts/${postId}/autosave`, {
          title,
          content,
          category,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          featuredImage
        });
        if (res.data?.saved) {
          setServerSavedAt(new Date().toLocaleTimeString());
        }
        setServerSaveState('idle');
      } catch (e) {
        console.error(e);
        setServerSaveState('error');
      }
    }, 1800);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [title, content, category, tags, featuredImage, loading, postId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFeaturedImage(res.data.url);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!postId) return;
      await api.put(`/posts/${postId}`, {
        title,
        content,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        status,
        featuredImage
      });
      if (localStorageKey) localStorage.removeItem(localStorageKey);
      navigate(`/post/${slug}`);
    } catch (err) {
      console.error(err);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline','strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  if (loading) return <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="editor-container">
      <RevisionHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        postId={postId}
        currentTitle={title}
        currentContent={content}
        onRestored={async () => {
          if (!slug) return;
          try {
            const postRes = await api.get(`/posts/${slug}`);
            const post = postRes.data;
            setPostId(post._id);
            setTitle(post.title);
            setContent(post.content);
            setCategory(post.category?._id || post.category);
            setTags((post.tags || []).join(', '));
            setFeaturedImage(post.featuredImage || '');
            setStatus(post.status || 'draft');
          } catch (e) {
            console.error(e);
          }
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Edit Post</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {serverSaveState === 'saving' && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Saving to server...</span>}
          {serverSaveState === 'error' && <span style={{ fontSize: '12px', color: 'rgba(255,120,120,0.9)' }}>Server auto-save failed</span>}
          {serverSavedAt && serverSaveState === 'idle' && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Server saved at {serverSavedAt}</span>}
          {lastSaved && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>â€¢ Local saved at {lastSaved}</span>}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            Version History
          </button>
          <button 
            type="button" 
            onClick={() => {
              if (window.confirm('Clear local draft changes? This will revert to the server version.')) {
                if (localStorageKey) localStorage.removeItem(localStorageKey);
                window.location.reload();
              }
            }}
            className="btn-secondary" 
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            Reset Draft
          </button>
        </div>
      </div>

      {showRecovery && localDraftMeta && (
        <div
          style={{
            border: '1px solid var(--border-color)',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '18px',
            padding: '14px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ fontWeight: 800, marginBottom: '4px' }}>Recovered a local draft</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Found unsaved changes on this device ({new Date(localDraftMeta.at).toLocaleString()}). Restore or discard.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (!localStorageKey) return;
                localStorage.removeItem(localStorageKey);
                setShowRecovery(false);
                setLocalDraftMeta(null);
              }}
              style={{ padding: '10px 14px', fontSize: '12px' }}
            >
              Discard
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const draft = localDraftMeta.draft || {};
                if (draft.title !== undefined) setTitle(draft.title);
                if (draft.content !== undefined) setContent(draft.content);
                if (draft.category !== undefined) setCategory(draft.category);
                if (draft.tags !== undefined) setTags(draft.tags);
                if (draft.featuredImage !== undefined) setFeaturedImage(draft.featuredImage);
                setShowRecovery(false);
              }}
              style={{ padding: '10px 14px', fontSize: '12px' }}
            >
              Restore draft
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-group">
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Title</label>
          <input
            type="text"
            required
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Category</label>
          <select
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat: any) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Content</label>
          <div className="quill-wrapper">
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={modules}
            />
          </div>
        </div>
        <div className="form-group">
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Featured Image</label>
          <div className="image-upload-container" style={{ 
            border: '2px dashed var(--glass-border)', 
            borderRadius: '12px', 
            padding: '24px', 
            textAlign: 'center',
            background: 'var(--glass-bg)',
            marginBottom: '16px'
          }}>
            {featuredImage ? (
              <div style={{ position: 'relative' }}>
                <img src={featuredImage} alt="Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }} />
                <button 
                  type="button" 
                  onClick={() => setFeaturedImage('')}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                >✕</button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id="image-upload"
                  hidden
                  onChange={handleImageUpload}
                  accept="image/*"
                />
                <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>🖼️</div>
                  <div style={{ fontWeight: '600' }}>{uploading ? 'Uploading...' : 'Click to upload featured image'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Supports JPG, PNG, WEBP (Max 5MB)</div>
                </label>
              </div>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Or paste an image URL:</div>
          <input
            type="text"
            className="form-input"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div className="form-group">
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Tags (comma separated)</label>
          <input
            type="text"
            className="form-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>Status</label>
          <select
            className="form-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '16px' }}>
          Update Post
        </button>
      </form>
    </div>
  );
};

export default EditPost;
