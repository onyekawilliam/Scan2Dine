import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import api from '../utils/api';

function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', description: '', emoji_icon: '🍽️' });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/menu/categories');
      if (res.data.success) {
        setCategories(res.data.data.categories || res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const errorMessage = (err, fallback) =>
    err.response?.data?.error?.message || err.response?.data?.message || fallback;

  const handleDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;

    const previous = categories;
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Show the new order immediately, save it, and roll back if the server refuses.
    setCategories(items);
    try {
      await api.put('/menu/categories/reorder', { order: items.map((c) => c._id) });
    } catch (err) {
      setCategories(previous);
      setError(errorMessage(err, 'Could not save the new order. Please try again.'));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', emoji_icon: '🍽️' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        emoji_icon: formData.emoji_icon.trim(),
      };
      if (editingId) {
        const res = await api.put(`/menu/categories/${editingId}`, payload);
        if (res.data.success) setCategories(categories.map((c) => (c._id === editingId ? res.data.data : c)));
      } else {
        const res = await api.post('/menu/categories', payload);
        if (res.data.success) setCategories([...categories, res.data.data]);
      }
      resetForm();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this category. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setError('');
    setEditingId(category._id);
    setFormData({ name: category.name, description: category.description || '', emoji_icon: category.emoji_icon || '🍽️' });
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    setError('');
    try {
      await api.delete(`/menu/categories/${category._id}`);
      setCategories(categories.filter((c) => c._id !== category._id));
      if (editingId === category._id) resetForm();
    } catch (err) {
      // e.g. 409 "This category still has 3 menu items. Move or delete them first."
      setError(errorMessage(err, 'Could not delete this category. Please try again.'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Categories Management</h1>
        <p className="text-slate-500">Organize your menu structure. Drag to reorder categories.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 p-6 sticky top-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{editingId ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                  placeholder="e.g. Appetizers" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                  placeholder="A brief description..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emoji Icon</label>
                <input 
                  value={formData.emoji_icon}
                  onChange={(e) => setFormData({...formData, emoji_icon: e.target.value})}
                  type="text" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" 
                />
              </div>
              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 transition-all">
                  {editingId ? <><Save size={18} /> Update</> : <><Plus size={18} /> Create</>}
                </button>
                {editingId && (
                  <button type="button" aria-label="Cancel editing" onClick={resetForm} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: Drag and Drop List */}
        <div className="lg:col-span-2">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex justify-between items-center">
              Menu Categories
              <span className="text-sm font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-600">{categories.length} Total</span>
            </h3>

            {loading ? (
              <div className="text-center py-12 text-slate-400">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                No categories yet. Create your first category!
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {categories.map((category, index) => (
                        <Draggable key={category._id} draggableId={category._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${snapshot.isDragging ? 'bg-white shadow-xl border-primary ring-2 ring-primary/20 z-50' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                            >
                              <div {...provided.dragHandleProps} className="p-2 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing">
                                <GripVertical size={20} />
                              </div>
                              
                              <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-2xl border border-slate-100 shrink-0">
                                {category.emoji_icon || '🍽️'}
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-800">{category.name}</h4>
                                {category.description && <p className="text-sm text-slate-500 truncate">{category.description}</p>}
                              </div>

                              <div className="flex gap-2">
                                <button type="button" aria-label={`Edit ${category.name}`} onClick={() => handleEdit(category)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Edit2 size={18} />
                                </button>
                                <button type="button" aria-label={`Delete ${category.name}`} onClick={() => handleDelete(category)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoriesManagement;
