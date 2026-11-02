import React, { useState, useEffect } from 'react';
import { Search, Plus, LayoutGrid, List as ListIcon, MoreHorizontal, CheckCircle2, XCircle, X, Image as ImageIcon } from 'lucide-react';
import api from '../utils/api';

import { useNavigate } from 'react-router-dom';

function MenuManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '', category_id: '', description: '', price: '', emoji_icon: '🍔', allergens: '', dietary_tags: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, catRes] = await Promise.all([
          api.get('/menu/items'),
          api.get('/menu/categories')
        ]);
        if (itemsRes.data.success) setItems(itemsRes.data.data.items || itemsRes.data.data);
        if (catRes.data.success) setCategories(catRes.data.data.categories || catRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openEditor = (item = null) => {
    if (item) {
      setEditingItem(item._id);
      setFormData({
        name: item.name,
        category_id: item.category_id?._id || item.category_id,
        description: item.description || '',
        price: item.price,
        emoji_icon: item.emoji_icon || '🍔',
        allergens: item.allergens?.join(', ') || '',
        dietary_tags: item.dietary_tags?.join(', ') || ''
      });
      setIsEditorOpen(true);
    } else {
      // If adding new item, navigate to dedicated page
      navigate('/dashboard/menu/add');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        price: parseFloat(formData.price)
      };

      if (formData.description?.trim()) payload.description = formData.description.trim();
      if (formData.emoji_icon?.trim()) payload.emoji_icon = formData.emoji_icon.trim();

      const allergensArray = formData.allergens.split(',').map(s => s.trim()).filter(Boolean);
      if (allergensArray.length > 0) payload.allergens = allergensArray;
      
      const dietaryArray = formData.dietary_tags.split(',').map(s => s.trim()).filter(Boolean);
      if (dietaryArray.length > 0) payload.dietary_tags = dietaryArray;

      if (editingItem) {
        // Mock Update (PUT route not built yet)
        setItems(items.map(i => i._id === editingItem ? { ...i, ...payload } : i));
      } else {
        const res = await api.post('/menu/items', payload);
        if (res.data.success) {
          setItems([...items, res.data.data.menuItem]);
        }
      }
      setIsEditorOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save item. Check console.');
    }
  };

  return (
    <div className="space-y-6 relative h-[calc(100vh-6rem)] flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="relative min-w-[250px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search menu items..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
          </div>
          
          <select className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary">
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}><ListIcon size={18} /></button>
          </div>
          <button onClick={() => navigate('/dashboard/menu/add')} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading menu items...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-white/50 backdrop-blur-xl rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400"><ImageIcon size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No menu items found</h3>
            <p className="text-slate-500 mb-6">Start building your beautiful digital menu today.</p>
            <button onClick={() => openEditor()} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium">Add First Item</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(item => (
              <div key={item._id} className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => openEditor(item)}>
                <div className="h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center text-6xl relative">
                  {item.emoji_icon || '🍔'}
                  <div className="absolute top-3 right-3">
                    {item.is_available ? <CheckCircle2 className="text-green-500 bg-white rounded-full" size={24} /> : <XCircle className="text-red-500 bg-white rounded-full" size={24} />}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1">{item.name}</h3>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">{item.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-bold text-green-600 text-lg">${item.price.toFixed(2)}</span>
                    <button className="text-slate-400 hover:text-primary"><MoreHorizontal size={20} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
             <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6 w-16">Icon</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item._id} onClick={() => openEditor(item)} className="hover:bg-slate-50/50 cursor-pointer transition-colors">
                    <td className="p-4 pl-6 text-2xl">{item.emoji_icon || '🍔'}</td>
                    <td className="p-4 font-bold text-slate-800">{item.name}</td>
                    <td className="p-4 text-sm text-slate-600">{typeof item.category_id === 'object' ? item.category_id.name : item.category_id}</td>
                    <td className="p-4 font-bold text-green-600">${item.price.toFixed(2)}</td>
                    <td className="p-4">
                      {item.is_available ? <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">Available</span> : <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full">Hidden</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Editor Sidebar (Slide-in) */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.1)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isEditorOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">{editingItem ? 'Edit Item' : 'New Menu Item'}</h2>
          <button onClick={() => setIsEditorOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full border border-slate-200">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Basic Info</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
              <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                <input required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} type="number" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select required value={formData.category_id} onChange={e=>setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none">
                  <option value="">Select...</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea rows="3" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emoji Icon</label>
              <input value={formData.emoji_icon} onChange={e=>setFormData({...formData, emoji_icon: e.target.value})} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Dietary Info</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Allergens (comma separated)</label>
              <input value={formData.allergens} onChange={e=>setFormData({...formData, allergens: e.target.value})} type="text" placeholder="e.g. Peanuts, Dairy, Gluten" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dietary Tags (comma separated)</label>
              <input value={formData.dietary_tags} onChange={e=>setFormData({...formData, dietary_tags: e.target.value})} type="text" placeholder="e.g. Vegan, Halal, Spicy" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button onClick={handleSave} className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            Save Item
          </button>
        </div>
      </div>
      
      {/* Backdrop for Sidebar */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40" onClick={() => setIsEditorOpen(false)}></div>
      )}
    </div>
  );
}

export default MenuManagement;
