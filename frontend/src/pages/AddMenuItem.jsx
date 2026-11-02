import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { errorMessage } from '../utils/format';
import ImageUpload from '../components/ImageUpload';
import PageHeader from '../components/ui/PageHeader';
import { useToast } from '../components/ui/toastContext';

const list = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

function AddMenuItem() {
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState(null); // null while loading
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', category_id: '', description: '', price: '', emoji_icon: '🍽️', image_url: '', allergens: '', dietary_tags: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/menu/categories');
        const found = res.data.data.categories || res.data.data;
        setCategories(found);
        if (found.length > 0) setForm((prev) => ({ ...prev, category_id: found[0]._id }));
      } catch (err) {
        setCategories([]);
        toast.error(errorMessage(err, 'Could not load your categories.'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), category_id: form.category_id, price: parseFloat(form.price) };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.emoji_icon.trim()) payload.emoji_icon = form.emoji_icon.trim();
      if (form.image_url) payload.image_url = form.image_url;
      if (list(form.allergens).length) payload.allergens = list(form.allergens);
      if (list(form.dietary_tags).length) payload.dietary_tags = list(form.dietary_tags);

      const res = await api.post('/menu/items', payload);
      if (res.data.success) {
        toast.success(`${payload.name} added to your menu.`);
        navigate('/dashboard/menu');
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not add this item. Please check the details and try again.'));
    } finally {
      setSaving(false);
    }
  };

  const noCategories = categories !== null && categories.length === 0;

  return (
    <div className="max-w-3xl">
      <Link to="/dashboard/menu" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to menu
      </Link>
      <PageHeader title="Add menu item" description="A name, a category and a price are all you need. The rest is optional." />

      {noCategories ? (
        <div className="card card-pad text-center">
          <h2 className="card-title">Create a category first</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Every dish belongs to a category, such as Starters, Mains or Drinks.</p>
          <Link to="/dashboard/categories" className="btn btn-primary mt-5">Create a category</Link>
        </div>
      ) : (
        <form onSubmit={handleSave} className="card">
          <div className="space-y-5 p-5 sm:p-6">
            <h2 className="card-title">Basics</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="label">Name</label>
                <input id="name" required minLength={2} maxLength={100} value={form.name} onChange={set('name')} placeholder="e.g. Jollof rice with chicken" className="input" />
              </div>
              <div>
                <label htmlFor="price" className="label">Price ($)</label>
                <input id="price" required type="number" step="0.01" min="0.01" value={form.price} onChange={set('price')} placeholder="0.00" className="input" />
              </div>
              <div>
                <label htmlFor="category" className="label">Category</label>
                <select id="category" required value={form.category_id} onChange={set('category_id')} className="input" disabled={categories === null}>
                  <option value="" disabled>{categories === null ? 'Loading…' : 'Select a category'}</option>
                  {(categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="description" className="label">Description <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea id="description" rows={3} maxLength={500} value={form.description} onChange={set('description')} placeholder="What's in it? How is it served?" className="input" />
              </div>
            </div>
          </div>

          <div className="space-y-5 border-t border-slate-200 p-5 sm:p-6">
            <h2 className="card-title">Photo</h2>
            <ImageUpload value={form.image_url} onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))} emoji={form.emoji_icon || '🍽️'} />
            <div>
              <label htmlFor="emoji" className="label">Emoji icon</label>
              <input id="emoji" value={form.emoji_icon} onChange={set('emoji_icon')} maxLength={8} className="input w-24 text-center text-lg" />
              <p className="hint">Shown instead when there is no photo.</p>
            </div>
          </div>

          <div className="space-y-5 border-t border-slate-200 p-5 sm:p-6">
            <h2 className="card-title">Dietary information <span className="text-sm font-normal text-slate-400">(optional)</span></h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="allergens" className="label">Allergens</label>
                <input id="allergens" value={form.allergens} onChange={set('allergens')} placeholder="Peanuts, Dairy, Gluten" className="input" />
                <p className="hint">Separate with commas.</p>
              </div>
              <div>
                <label htmlFor="tags" className="label">Dietary tags</label>
                <input id="tags" value={form.dietary_tags} onChange={set('dietary_tags')} placeholder="Vegan, Halal, Spicy" className="input" />
              </div>
            </div>
          </div>

          {error && <p role="alert" className="alert-error mx-5 mb-5 sm:mx-6">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
            <button type="button" onClick={() => navigate('/dashboard/menu')} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving || categories === null} className="btn btn-primary">{saving ? 'Adding…' : 'Add item'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AddMenuItem;
