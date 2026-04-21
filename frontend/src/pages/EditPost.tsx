import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../services/api';
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
  const { slug } = useParams();
  const navigate = useNavigate();

  // Load draft from localStorage
  useEffect(() => {
    if (!slug) return;
    const savedDraft = localStorage.getItem(`post-draft-${slug}`);
    if (savedDraft) {
      const { title, content, category, tags, featuredImage } = JSON.parse(savedDraft);
      if (title) setTitle(title);
      if (content) setContent(content);
      if (category) setCategory(category);
      if (tags) setTags(tags);
      if (featuredImage) setFeaturedImage(featuredImage);
    }
  }, [slug]);

  // Save draft to localStorage
  useEffect(() => {
    if (loading || !slug) return;
    const draft = { title, content, category, tags, featuredImage };
    localStorage.setItem(`post-draft-${slug}`, JSON.stringify(draft));
    setLastSaved(new Date().toLocaleTimeString());
  }, [title, content, category, tags, featuredImage, loading, slug]);

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
        setTitle(post.title);
        setContent(post.content);
        setCategory(post.category?._id || post.category);
        setTags(post.tags.join(', '));
        setFeaturedImage(post.featuredImage);
        setStatus(post.status);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

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
      const postRes = await api.get(`/posts/${slug}`);
      const postId = postRes.data._id;
      
      await api.put(`/posts/${postId}`, {
        title,
        content,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        status,
        featuredImage
      });
      localStorage.removeItem(`post-draft-${slug}`);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Edit Post</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastSaved && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Draft auto-saved at {lastSaved}</span>}
          <button 
            type="button" 
            onClick={() => {
              if (window.confirm('Clear local draft changes? This will revert to the server version.')) {
                localStorage.removeItem(`post-draft-${slug}`);
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
