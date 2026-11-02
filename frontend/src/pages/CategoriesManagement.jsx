import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Pencil, Plus, Save, Tags, Trash2, X } from 'lucide-react';
import api from '../utils/api';
import { errorMessage, } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/toastContext';

const BLANK = { name: '', description: '', emoji_icon: '🍽️' };

function CategoriesManagement() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({}); // category id -> number of items
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [catRes, itemRes] = await Promise.all([api.get('/menu/categories'), api.get('/menu/items')]);
        setCategories(catRes.data.data.categories || catRes.data.data);
        const tally = {};
        (itemRes.data.data.items || itemRes.data.data).forEach((item) => {
          const id = typeof item.category_id === 'object' ? item.category_id?._id : item.category_id;
          tally[id] = (tally[id] || 0) + 1;
        });
        setCounts(tally);
      } catch (err) {
        toast.error(errorMessage(err, 'Could not load your categories.'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const resetForm = () => {
    setEditingId(null);
    setForm(BLANK);
    setError('');
  };

  const handleDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;

    const previous = categories;
    const reordered = Array.from(categories);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    // Show the new order immediately, save it, and roll back if the server refuses.
    setCategories(reordered);
    try {
      await api.put('/menu/categories/reorder', { order: reordered.map((c) => c._id) });
    } catch (err) {
      setCategories(previous);
      toast.error(errorMessage(err, 'Could not save the new order. Please try again.'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), description: form.description.trim(), emoji_icon: form.emoji_icon.trim() };
      if (editingId) {
        const res = await api.put(`/menu/categories/${editingId}`, payload);
        setCategories((prev) => prev.map((c) => (c._id === editingId ? res.data.data : c)));
        toast.success('Category updated.');
      } else {
        const res = await api.post('/menu/categories', payload);
        setCategories((prev) => [...prev, res.data.data]);
        toast.success(`${payload.name} created.`);
      }
      resetForm();
    } catch (err) {
      setError(errorMessage(err, 'Could not save this category. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setError('');
    setEditingId(category._id);
    setForm({ name: category.name, description: category.description || '', emoji_icon: category.emoji_icon || '🍽️' });
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    try {
      await api.delete(`/menu/categories/${category._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== category._id));
      if (editingId === category._id) resetForm();
      toast.success('Category deleted.');
    } catch (err) {
      // e.g. 409 "This category still has 3 menu items. Move or delete them first."
      toast.error(errorMessage(err, 'Could not delete this category. Please try again.'));
    }
  };

  return (
    <div>
      <PageHeader title="Categories" description="Group your dishes. Guests see categories in this order, so drag to rearrange." />

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="card card-pad h-fit lg:sticky lg:top-8">
          <h2 className="card-title">{editingId ? 'Edit category' : 'New category'}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="cat-name" className="label">Name</label>
              <input id="cat-name" required maxLength={50} value={form.name} onChange={set('name')} placeholder="e.g. Starters" className="input" />
            </div>
            <div>
              <label htmlFor="cat-desc" className="label">Description <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea id="cat-desc" rows={2} maxLength={200} value={form.description} onChange={set('description')} className="input" />
            </div>
            <div>
              <label htmlFor="cat-emoji" className="label">Emoji icon</label>
              <input id="cat-emoji" maxLength={8} value={form.emoji_icon} onChange={set('emoji_icon')} className="input w-24 text-center text-lg" />
            </div>
            {error && <p role="alert" className="alert-error">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                {editingId ? <><Save size={16} /> Save</> : <><Plus size={16} /> Create</>}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} aria-label="Cancel editing" className="btn btn-secondary !px-3"><X size={16} /></button>
              )}
            </div>
          </div>
        </form>

        <section className="card lg:col-span-2" aria-label="Your categories">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="card-title">Your categories</h2>
            <span className="badge badge-neutral">{categories.length}</span>
          </div>

          {loading ? (
            <p className="p-12 text-center text-sm text-slate-500">Loading categories…</p>
          ) : categories.length === 0 ? (
            <EmptyState icon={Tags} title="No categories yet" description="Create your first category on the left. Starters, Mains and Drinks are a good start." />
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <ul {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-slate-100">
                    {categories.map((category, index) => {
                      const count = counts[category._id] || 0;
                      return (
                        <Draggable key={category._id} draggableId={category._id} index={index}>
                          {(drag, snapshot) => (
                            <li
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              className={`flex items-center gap-3 bg-white px-4 py-3 ${snapshot.isDragging ? 'rounded-xl shadow-lg ring-1 ring-slate-200' : ''}`}
                            >
                              <span {...drag.dragHandleProps} aria-label={`Reorder ${category.name}`} className="cursor-grab rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing">
                                <GripVertical size={18} />
                              </span>
                              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xl" aria-hidden="true">{category.emoji_icon || '🍽️'}</span>
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-semibold text-slate-900">{category.name}</h3>
                                <p className="truncate text-xs text-slate-500">
                                  {count} {count === 1 ? 'item' : 'items'}
                                  {category.description ? ` · ${category.description}` : ''}
                                </p>
                              </div>
                              <button type="button" aria-label={`Edit ${category.name}`} onClick={() => startEdit(category)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                                <Pencil size={16} />
                              </button>
                              <button type="button" aria-label={`Delete ${category.name}`} onClick={() => handleDelete(category)} className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                                <Trash2 size={16} />
                              </button>
                            </li>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </section>
      </div>
    </div>
  );
}

export default CategoriesManagement;
