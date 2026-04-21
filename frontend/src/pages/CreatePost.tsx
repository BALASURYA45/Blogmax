import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../services/api';
import '../App.css';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('draft');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('post-draft');
    if (savedDraft) {
      const { title, content, category, tags, featuredImage } = JSON.parse(savedDraft);
      if (title) setTitle(title);
      if (content) setContent(content);
      if (category) setCategory(category);
      if (tags) setTags(tags);
      if (featuredImage) setFeaturedImage(featuredImage);
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    const draft = { title, content, category, tags, featuredImage };
    localStorage.setItem('post-draft', JSON.stringify(draft));
    setLastSaved(new Date().toLocaleTimeString());
  }, [title, content, category, tags, featuredImage]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data && res.data.length > 0) {
          setCategories(res.data);
          setCategory(res.data[0]._id);
        } else {
          // Fallback categories if database is empty
          const defaults: any = [
            { _id: 'education', name: 'Education' },
            { _id: 'sports', name: 'Sports' },
            { _id: 'comedy', name: 'Comedy' },
            { _id: 'life', name: 'Life' },
            { _id: 'technology', name: 'Technology' },
            { _id: 'entertainment', name: 'Entertainment' },
            { _id: 'business', name: 'Business' }
          ];
          setCategories(defaults);
          setCategory(defaults[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

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
      await api.post('/posts', {
        title,
        content,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        status,
        featuredImage
      });
      localStorage.removeItem('post-draft');
      navigate('/');
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

  return (
    <div className="editor-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Create New Post</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastSaved && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Draft auto-saved at {lastSaved}</span>}
          <button 
            type="button" 
            onClick={() => {
              if (window.confirm('Clear draft? This cannot be undone.')) {
                setTitle('');
                setContent('');
                setCategory(categories[0]?._id || '');
                setTags('');
                setFeaturedImage('');
                localStorage.removeItem('post-draft');
              }
            }}
            className="btn-secondary" 
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            Clear Draft
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
          Save Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
