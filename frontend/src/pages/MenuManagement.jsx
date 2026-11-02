import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LayoutGrid, List as ListIcon, Plus, Search, Trash2, UtensilsCrossed, X } from 'lucide-react';
import api from '../utils/api';
import { photoUrl } from '../utils/cloudinary';
import { money, errorMessage } from '../utils/format';
import ImageUpload from '../components/ImageUpload';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/toastContext';

const BLANK = { name: '', category_id: '', description: '', price: '', emoji_icon: '🍽️', allergens: '', dietary_tags: '', is_available: true, image_url: '' };

const categoryIdOf = (item) => (typeof item.category_id === 'object' ? item.category_id?._id : item.category_id);
const categoryNameOf = (item) => (typeof item.category_id === 'object' ? item.category_id?.name : '');

// A square thumbnail: the photo when there is one, otherwise the emoji icon.
function Thumb({ item, size, className = '' }) {
  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden bg-slate-100 ${className}`}>
      {item.image_url ? (
        <img src={photoUrl(item.image_url, size)} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <span className={size >= 300 ? 'text-6xl' : 'text-2xl'} aria-hidden="true">{item.emoji_icon || '🍽️'}</span>
      )}
    </div>
  );
}

function MenuManagement() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Editor
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [itemsRes, catRes] = await Promise.all([api.get('/menu/items'), api.get('/menu/categories')]);
        setItems(itemsRes.data.data.items || itemsRes.data.data);
        setCategories(catRes.data.data.categories || catRes.data.data);
      } catch (err) {
        toast.error(errorMessage(err, 'Could not load your menu.'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = categoryFilter === 'All' || categoryIdOf(item) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openEditor = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      category_id: categoryIdOf(item) || '',
      description: item.description || '',
      price: item.price,
      emoji_icon: item.emoji_icon || '🍽️',
      allergens: item.allergens?.join(', ') || '',
      dietary_tags: item.dietary_tags?.join(', ') || '',
      is_available: item.is_available !== false,
      image_url: item.image_url || '',
    });
    setFormError('');
  };

  const closeEditor = () => setEditingId(null);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const list = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingId || saving) return;
    setSaving(true);
    setFormError('');
    try {
      // Sent in full (empty strings and empty lists included) so fields can be cleared.
      const res = await api.put(`/menu/items/${editingId}`, {
        name: form.name.trim(),
        category_id: form.category_id,
        price: parseFloat(form.price),
        description: form.description.trim(),
        emoji_icon: form.emoji_icon.trim(),
        allergens: list(form.allergens),
        dietary_tags: list(form.dietary_tags),
        is_available: form.is_available,
        image_url: form.image_url, // '' removes the photo
      });
      if (res.data.success) {
        setItems((prev) => prev.map((i) => (i._id === editingId ? res.data.data : i)));
        closeEditor();
        toast.success('Item saved.');
      }
    } catch (err) {
      setFormError(errorMessage(err, 'Could not save this item. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId || saving) return;
    if (!window.confirm('Delete this menu item? This cannot be undone.')) return;
    setSaving(true);
    try {
      await api.delete(`/menu/items/${editingId}`);
      setItems((prev) => prev.filter((i) => i._id !== editingId));
      closeEditor();
      toast.success('Item deleted.');
    } catch (err) {
      setFormError(errorMessage(err, 'Could not delete this item. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // Quick show/hide from the card, without opening the editor.
  const toggleAvailability = async (item) => {
    try {
      const res = await api.put(`/menu/items/${item._id}`, { is_available: !item.is_available });
      if (res.data.success) {
        setItems((prev) => prev.map((i) => (i._id === item._id ? res.data.data : i)));
        toast.success(res.data.data.is_available ? `${item.name} is available again.` : `${item.name} marked sold out.`);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this item.'));
    }
  };

  const StockButton = ({ item }) => (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggleAvailability(item); }}
      aria-label={item.is_available ? `Mark ${item.name} sold out` : `Mark ${item.name} available`}
      title={item.is_available ? 'Mark sold out' : 'Mark available'}
      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
    >
      {item.is_available ? <Eye size={18} /> : <EyeOff size={18} />}
    </button>
  );

  const editorOpen = editingId !== null;

  return (
    <div>
      <PageHeader title="Menu items" description="What guests see and can order. Changes show on your customer menu straight away.">
        <button type="button" onClick={() => navigate('/dashboard/menu/add')} className="btn btn-primary">
          <Plus size={16} /> Add item
        </button>
      </PageHeader>

      {!loading && items.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu items" aria-label="Search menu items" className="input pl-10" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by category" className="input sm:w-52">
            <option value="All">All categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5" role="group" aria-label="View">
            {[['grid', LayoutGrid, 'Grid view'], ['list', ListIcon, 'List view']].map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-label={label}
                aria-pressed={viewMode === mode}
                className={`rounded-md px-2.5 py-1.5 ${viewMode === mode ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">Loading your menu…</p>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={UtensilsCrossed}
            title="Your menu is empty"
            description={categories.length === 0 ? 'Start with a category such as Starters or Drinks, then add your first dish.' : 'Add your first dish. A name and a price is enough.'}
          >
            {categories.length === 0 && <button type="button" onClick={() => navigate('/dashboard/categories')} className="btn btn-secondary">Create a category</button>}
            <button type="button" onClick={() => navigate('/dashboard/menu/add')} className="btn btn-primary"><Plus size={16} /> Add item</button>
          </EmptyState>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card">
          <EmptyState icon={Search} title="No items match" description="Try a different search or category.">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setCategoryFilter('All'); }}>Clear filters</button>
          </EmptyState>
        </div>
      ) : viewMode === 'grid' ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <li key={item._id}>
              <article className={`card group overflow-hidden transition-shadow hover:shadow-md ${item.is_available ? '' : 'opacity-75'}`}>
                <button type="button" onClick={() => openEditor(item)} className="block w-full text-left" aria-label={`Edit ${item.name}`}>
                  <Thumb item={item} size={400} className="h-40 w-full" />
                  <div className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{item.name}</h3>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{money(item.price)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 min-h-8 text-xs text-slate-500">{item.description || 'No description'}</p>
                  </div>
                </button>
                <div className="flex items-center justify-between px-4 pb-3">
                  <span className="text-xs text-slate-400">{categoryNameOf(item)}</span>
                  <div className="flex items-center gap-1">
                    <span className={`badge ${item.is_available ? 'badge-ready' : 'badge-cancelled'}`}>{item.is_available ? 'Available' : 'Sold out'}</span>
                    <StockButton item={item} />
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="table-head">
                <th className="py-3 pl-4"><span className="sr-only">Photo</span></th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item._id} onClick={() => openEditor(item)} className="cursor-pointer hover:bg-slate-50">
                  <td className="py-2 pl-4"><Thumb item={item} size={96} className="size-10 rounded-lg" /></td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{categoryNameOf(item)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">{money(item.price)}</td>
                  <td className="px-4 py-3"><span className={`badge ${item.is_available ? 'badge-ready' : 'badge-cancelled'}`}>{item.is_available ? 'Available' : 'Sold out'}</span></td>
                  <td className="px-2 py-3 text-right"><StockButton item={item} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Editor: slides in from the right */}
      {editorOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Edit menu item">
          <button type="button" aria-label="Close editor" className="absolute inset-0 bg-slate-900/40" onClick={closeEditor} />
          <form onSubmit={handleSave} className="animate-fade-in-up absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Edit item</h2>
              <button type="button" onClick={closeEditor} aria-label="Close" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <ImageUpload value={form.image_url} onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))} emoji={form.emoji_icon || '🍽️'} />

              <div>
                <label htmlFor="e-name" className="label">Name</label>
                <input id="e-name" required minLength={2} value={form.name} onChange={set('name')} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="e-price" className="label">Price ($)</label>
                  <input id="e-price" required type="number" step="0.01" min="0.01" value={form.price} onChange={set('price')} className="input" />
                </div>
                <div>
                  <label htmlFor="e-cat" className="label">Category</label>
                  <select id="e-cat" required value={form.category_id} onChange={set('category_id')} className="input">
                    <option value="">Select…</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="e-desc" className="label">Description</label>
                <textarea id="e-desc" rows={3} maxLength={500} value={form.description} onChange={set('description')} className="input" />
              </div>
              <div>
                <label htmlFor="e-emoji" className="label">Emoji icon</label>
                <input id="e-emoji" value={form.emoji_icon} onChange={set('emoji_icon')} maxLength={8} className="input w-24 text-center text-lg" />
                <p className="hint">Shown when the item has no photo.</p>
              </div>
              <div>
                <label htmlFor="e-allergens" className="label">Allergens</label>
                <input id="e-allergens" value={form.allergens} onChange={set('allergens')} placeholder="Peanuts, Dairy, Gluten" className="input" />
                <p className="hint">Separate with commas.</p>
              </div>
              <div>
                <label htmlFor="e-tags" className="label">Dietary tags</label>
                <input id="e-tags" value={form.dietary_tags} onChange={set('dietary_tags')} placeholder="Vegan, Halal, Spicy" className="input" />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
                <input type="checkbox" checked={form.is_available} onChange={(e) => setForm((prev) => ({ ...prev, is_available: e.target.checked }))} className="mt-0.5 size-4 rounded border-slate-300 text-primary" />
                <span>
                  <span className="block text-sm font-medium text-slate-900">Available to order</span>
                  <span className="block text-xs text-slate-500">Turn off when sold out. Guests still see the item but cannot order it.</span>
                </span>
              </label>

              {formError && <p role="alert" className="alert-error">{formError}</p>}
            </div>

            <div className="flex gap-3 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={handleDelete} disabled={saving} aria-label="Delete item" className="btn btn-danger !px-3"><Trash2 size={16} /></button>
              <button type="submit" disabled={saving} className="btn btn-primary flex-1">{saving ? 'Saving…' : 'Save item'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default MenuManagement;
