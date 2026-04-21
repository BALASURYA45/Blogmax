import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', formData);
      setFormData({ name: '', description: '' });
      setShowAddForm(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to add category');
    }
  };

  const handleUpdateCategory = async (id: string) => {
    try {
      await api.put(`/categories/${id}`, formData);
      setIsEditing(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        console.error(err);
        alert('Failed to delete category');
      }
    }
  };

  const startEdit = (cat: any) => {
    setIsEditing(cat._id);
    setFormData({ name: cat.name, description: cat.description || '' });
  };

  return (
    <div className="categories-page">
      <Helmet>
        <title>Categories | BlogMax</title>
      </Helmet>
      
      <div className="container" style={{ paddingBottom: '100px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-section"
        >
          <h1 className="auth-title">Explore by Category</h1>
          <p className="auth-subtitle">Find stories that match your interests across our diverse topics.</p>
          
          {isAdmin && !showAddForm && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
              style={{ marginTop: '24px', padding: '12px 32px', borderRadius: '30px' }}
            >
              Add New Category
            </button>
          )}

          {isAdmin && showAddForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddCategory}
              style={{ maxWidth: '500px', margin: '32px auto', background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--primary)', textAlign: 'left' }}
            >
              <h3 style={{ marginBottom: '16px', color: 'var(--text-color)' }}>New Category</h3>
              <input 
                type="text" 
                placeholder="Category Name" 
                className="form-input"
                style={{ width: '100%', marginBottom: '12px', color: 'var(--text-color)' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <textarea 
                placeholder="Description" 
                className="form-input"
                style={{ width: '100%', marginBottom: '16px', color: 'var(--text-color)', minHeight: '80px' }}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </motion.form>
          )}
        </motion.div>

        {loading ? (
          <div className="loading-state">Loading categories...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', marginTop: '40px' }}>
            {categories.map((cat) => (
              <motion.div 
                key={cat._id}
                whileHover={{ scale: 1.05 }}
                className="category-card"
                style={{ 
                  background: 'var(--surface-color)', 
                  padding: '40px', 
                  borderRadius: '24px', 
                  border: isEditing === cat._id ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {isEditing === cat._id ? (
                  <div style={{ textAlign: 'left' }}>
                    <input 
                      type="text" 
                      className="form-input"
                      style={{ width: '100%', marginBottom: '12px', color: 'var(--text-color)' }}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <textarea 
                      className="form-input"
                      style={{ width: '100%', marginBottom: '16px', color: 'var(--text-color)', minHeight: '60px' }}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleUpdateCategory(cat._id)} className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>Update</button>
                      <button onClick={() => setIsEditing(null)} className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{ color: 'var(--primary-bright)', fontSize: '24px', marginBottom: '12px' }}>{cat.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                      {cat.description || `Explore the latest insights and stories in ${cat.name}.`}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <Link to={`/?category=${cat._id}`} className="btn-edit" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '12px' }}>
                        View Posts
                      </Link>
                      {isAdmin && (
                        <>
                          <button onClick={() => startEdit(cat)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px', border: '1px solid var(--glass-border)' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteCategory(cat._id)} className="btn-delete" style={{ padding: '8px 16px', fontSize: '12px' }}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
