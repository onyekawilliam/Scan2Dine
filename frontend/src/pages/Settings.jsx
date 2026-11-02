import React, { useState } from 'react';
import { Save, Store, Clock, CreditCard, Bell, Palette, Shield, UserCircle } from 'lucide-react';
import api from '../utils/api';

function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [generalData, setGeneralData] = useState({
    restaurant_name: '',
    owner_name: '',
    email: '',
    phone: '',
    description: '',
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const { restaurant_name, owner_name, email, phone, description } = res.data.data;
          setGeneralData({
            restaurant_name: restaurant_name || '',
            owner_name: owner_name || '',
            email: email || '',
            phone: phone || '',
            description: description || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', generalData);
      if (res.data.success) {
        // Update local storage so other pages (like QR) get the new name
        localStorage.setItem('user', JSON.stringify(res.data.data));
        alert('Settings saved successfully!');
      }
    } catch (err) {
      console.error('Update Profile Error:', err);
      const message = err.response?.data?.message || err.response?.data?.error?.message || 'Failed to save settings.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Information', icon: Store },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'payment', label: 'Payment & Pricing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance & Branding', icon: Palette },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Restaurant Settings</h1>
        <p className="text-slate-500">Configure your restaurant information and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 p-4 sticky top-8">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
            
            {activeTab === 'general' && (
              <div>
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800">General Information</h2>
                  <p className="text-slate-500 text-sm">Update your basic restaurant details.</p>
                </div>
                {fetching ? (
                  <div className="p-12 text-center text-slate-400">Loading settings...</div>
                ) : (
                <form onSubmit={handleSave} className="p-6 space-y-6">
                  
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                      <Store size={40} />
                    </div>
                    <div>
                      <button type="button" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                        Change Logo
                      </button>
                      <p className="text-xs text-slate-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
                      <input value={generalData.restaurant_name} onChange={(e) => setGeneralData({...generalData, restaurant_name: e.target.value})} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Owner Name</label>
                      <input value={generalData.owner_name} onChange={(e) => setGeneralData({...generalData, owner_name: e.target.value})} type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input value={generalData.email} onChange={(e) => setGeneralData({...generalData, email: e.target.value})} type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                      <input value={generalData.phone} onChange={(e) => setGeneralData({...generalData, phone: e.target.value})} type="tel" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea value={generalData.description} onChange={(e) => setGeneralData({...generalData, description: e.target.value})} rows="4" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none" />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70">
                      <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
                )}
              </div>
            )}

            {activeTab !== 'general' && (
              <div className="p-12 text-center text-slate-500 border-2 border-dashed border-slate-100 m-6 rounded-2xl">
                <p className="text-lg font-medium text-slate-700 mb-2">{tabs.find(t => t.id === activeTab)?.label} Settings</p>
                <p>This section is currently under development.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
