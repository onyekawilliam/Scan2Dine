import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ChefHat } from 'lucide-react';
import api from '../utils/api';

function AddMenuItem() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    emoji_icon: '🍽️',
    allergens: '',
    dietary_tags: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/menu/categories');
        if (res.data.success) {
          const fetchedCategories = res.data.data.categories || res.data.data;
          setCategories(fetchedCategories);
          if (fetchedCategories.length > 0) {
            setFormData(prev => ({ ...prev, category_id: fetchedCategories[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        price: parseFloat(formData.price),
      };
      
      // Only attach optional strings if they are not empty to avoid Joi validation errors
      if (formData.description.trim()) payload.description = formData.description.trim();
      if (formData.emoji_icon.trim()) payload.emoji_icon = formData.emoji_icon.trim();
      
      const allergensArray = formData.allergens.split(',').map(s => s.trim()).filter(Boolean);
      if (allergensArray.length > 0) payload.allergens = allergensArray;
      
      const dietaryArray = formData.dietary_tags.split(',').map(s => s.trim()).filter(Boolean);
      if (dietaryArray.length > 0) payload.dietary_tags = dietaryArray;

      const res = await api.post('/menu/items', payload);
      if (res.data.success) {
        navigate('/dashboard/menu');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to add item. Please ensure all fields are correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/menu')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors text-slate-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Add Menu Item</h1>
            <p className="text-slate-500">Create a new dish for your digital menu.</p>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <form onSubmit={handleSave} className="p-8 space-y-8">
          
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ChefHat className="text-primary" size={20} />
              <h3 className="font-bold text-lg text-slate-800">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Item Name *</label>
                <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="e.g. Truffle Fries" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price ($) *</label>
                <input required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} type="number" step="0.01" min="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="0.00" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category *</label>
                <select required value={formData.category_id} onChange={e=>setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all">
                  <option value="" disabled>Select a category...</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                {categories.length === 0 && <p className="text-xs text-red-500 mt-2">You must create a category first!</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea rows="3" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="A brief description of the dish..." />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Emoji Icon</label>
                <div className="flex gap-4 items-center">
                  <input value={formData.emoji_icon} onChange={e=>setFormData({...formData, emoji_icon: e.target.value})} type="text" className="w-24 text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-2xl" placeholder="🍔" />
                  <span className="text-sm text-slate-500">Pick an emoji to represent this item visually.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dietary Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">Dietary & Allergen Info (Optional)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Allergens</label>
                <input value={formData.allergens} onChange={e=>setFormData({...formData, allergens: e.target.value})} type="text" placeholder="e.g. Peanuts, Dairy, Gluten (comma separated)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Dietary Tags</label>
                <input value={formData.dietary_tags} onChange={e=>setFormData({...formData, dietary_tags: e.target.value})} type="text" placeholder="e.g. Vegan, Halal, Spicy (comma separated)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/dashboard/menu')} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0">
              <Save size={20} />
              {loading ? 'Saving...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMenuItem;
