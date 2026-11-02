import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Store } from 'lucide-react';
import Logo from './Logo';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [isSignIn, setIsSignIn] = useState(initialMode === 'signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurant_name: '',
    owner_name: '',
    email: '',
    password: '',
    phone: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = isSignIn ? '/auth/login' : '/auth/register';
      const payload = isSignIn 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await api.post(endpoint, payload);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in-up border border-white/50">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center border-b border-slate-100 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex justify-center mb-4">
             <Logo size="hero" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isSignIn ? 'Welcome Back' : 'Join Scan2Dine'}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {isSignIn ? 'Enter your details to access your dashboard.' : 'Create an account to start managing your restaurant.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 text-center">
              {error}
            </div>
          )}

          {!isSignIn && (
            <>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store size={18} className="text-slate-400" />
                  </div>
                  <input name="restaurant_name" value={formData.restaurant_name} onChange={handleChange} type="text" required placeholder="Restaurant Name" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                </div>
                
                <div className="flex gap-4">
                   <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <input name="owner_name" value={formData.owner_name} onChange={handleChange} type="text" required placeholder="Owner Name" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                  </div>
                   <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-slate-400" />
                    </div>
                    <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="Phone" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input name="email" value={formData.email} onChange={handleChange} type="email" required placeholder="Email Address" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input name="password" value={formData.password} onChange={handleChange} type="password" required placeholder="Password" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Processing...' : (isSignIn ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="px-8 pb-8 text-center">
          <p className="text-slate-500 text-sm">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsSignIn(!isSignIn); setError(null); }} 
              className="text-accent font-bold hover:underline"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
