import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X } from 'lucide-react';
import Logo from './Logo';
import api from '../utils/api';

const EMPTY = { restaurant_name: '', owner_name: '', email: '', password: '', phone: '' };

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(initialMode === 'signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const firstField = useRef(null);

  // Each time the box opens it starts in the mode that was asked for (sign in or create account).
  useEffect(() => {
    if (!isOpen) return undefined;
    setIsSignIn(initialMode === 'signin');
    setError('');
    setShowPassword(false);
    const focusTimer = setTimeout(() => firstField.current?.focus(), 50);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const switchMode = () => {
    setIsSignIn((v) => !v);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const payload = isSignIn
        ? { email: form.email, password: form.password }
        : { ...form, phone: form.phone.trim() || undefined };
      const res = await api.post(isSignIn ? '/auth/login' : '/auth/register', payload);
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'We could not reach the server. Check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const title = isSignIn ? 'Sign in to Scan2Dine' : 'Create your account';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/50" onClick={onClose} />

      <div className="animate-fade-in-up relative max-h-full w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <X size={18} />
        </button>

        <div className="mb-6">
          <Logo />
          <h2 id="auth-title" className="mt-4 text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isSignIn ? 'Welcome back. Enter your details to open your dashboard.' : 'Set up your restaurant in a few minutes.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSignIn && (
            <>
              <div>
                <label htmlFor="restaurant_name" className="label">Restaurant name</label>
                <input ref={firstField} id="restaurant_name" required minLength={3} maxLength={100} autoComplete="organization" value={form.restaurant_name} onChange={set('restaurant_name')} className="input" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="owner_name" className="label">Your name</label>
                  <input id="owner_name" required minLength={2} maxLength={50} autoComplete="name" value={form.owner_name} onChange={set('owner_name')} className="input" />
                </div>
                <div>
                  <label htmlFor="phone" className="label">Phone <span className="font-normal text-slate-400">(optional)</span></label>
                  <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className="input" />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input ref={isSignIn ? firstField : undefined} id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} className="input" />
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={isSignIn ? undefined : 8}
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={set('password')}
                className="input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {!isSignIn && <p className="hint">At least 8 characters, with a letter and a number.</p>}
          </div>

          {error && <p role="alert" className="alert-error">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
            {loading ? 'Please wait…' : isSignIn ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isSignIn ? 'New to Scan2Dine? ' : 'Already have an account? '}
          <button type="button" onClick={switchMode} className="font-semibold text-primary hover:underline">
            {isSignIn ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
