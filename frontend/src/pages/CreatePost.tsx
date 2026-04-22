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
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [savingLocal, setSavingLocal] = useState(false);
  const navigate = useNavigate();
  const localNowInput = (() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  })();

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('post-draft');
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      const draft = parsed?.draft || parsed; // backward compatible
      const { title, content, category, tags, featuredImage, scheduledAt } = draft;
      if (title) setTitle(title);
      if (content) setContent(content);
      if (category) setCategory(category);
      if (tags) setTags(tags);
      if (featuredImage) setFeaturedImage(featuredImage);
      if (scheduledAt) {
        setScheduleEnabled(true);
        setScheduledAt(scheduledAt);
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    setSavingLocal(true);
    const t = window.setTimeout(() => {
      const draft = { title, content, category, tags, featuredImage, scheduledAt: scheduleEnabled ? scheduledAt : '' };
      localStorage.setItem('post-draft', JSON.stringify({ at: new Date().toISOString(), draft }));
      setLastSaved(new Date().toLocaleTimeString());
      setSavingLocal(false);
    }, 750);
    return () => window.clearTimeout(t);
  }, [title, content, category, tags, featuredImage, scheduleEnabled, scheduledAt]);

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
        featuredImage,
        scheduledAt: scheduleEnabled && scheduledAt ? scheduledAt : null
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
          {savingLocal && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Saving draft...</span>}
          {!savingLocal && lastSaved && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Draft saved at {lastSaved}</span>}
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

        <div className="form-group">
          <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Scheduled Publishing</label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Publish this draft automatically at a specific time.
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(e) => {
                  const on = e.target.checked;
                  setScheduleEnabled(on);
                  if (on) setStatus('draft');
                  if (!on) setScheduledAt('');
                }}
              />
              <span style={{ fontWeight: 700, fontSize: '13px' }}>Enable</span>
            </label>
          </div>

          {scheduleEnabled && (
            <div style={{ marginTop: '12px' }}>
              <input
                type="datetime-local"
                className="form-input"
                value={scheduledAt}
                min={localNowInput}
                onChange={(e) => {
                  setScheduledAt(e.target.value);
                  setStatus('draft');
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                This post will stay as a draft until the scheduled time, then it will publish automatically.
              </div>
            </div>
          )}
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '16px' }}>
          Save Post
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
