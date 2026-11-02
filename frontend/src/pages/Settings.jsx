import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Save } from 'lucide-react';
import api from '../utils/api';
import { errorMessage } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import { useToast } from '../components/ui/toastContext';

const EMPTY = { restaurant_name: '', owner_name: '', email: '', phone: '', address: '', description: '' };

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

function Settings() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [slug, setSlug] = useState('');
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/me');
        const data = res.data.data;
        setForm({
          restaurant_name: data.restaurant_name || '',
          owner_name: data.owner_name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          description: data.description || '',
        });
        setSlug(data.slug || '');
      } catch (err) {
        toast.error(errorMessage(err, 'Could not load your settings.'));
      } finally {
        setFetching(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      if (res.data.success) {
        // Keep the saved name and email in the browser so the sidebar updates straight away.
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, ...res.data.data }));
        toast.success('Settings saved.');
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save your settings.'));
    } finally {
      setSaving(false);
    }
  };

  const menuUrl = `${window.location.origin}/menu/${slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy automatically. Select the link and copy it.');
    }
  };

  if (fetching) return <p className="py-16 text-center text-sm text-slate-500">Loading settings…</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Your restaurant's details, as customers and staff see them." />

      <form onSubmit={handleSave} className="card">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="card-title">Restaurant profile</h2>
          <p className="mt-1 text-sm text-slate-500">The name, description and address appear at the top of your customer menu.</p>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <Field id="restaurant_name" label="Restaurant name">
            <input id="restaurant_name" value={form.restaurant_name} onChange={set('restaurant_name')} required minLength={3} className="input" />
          </Field>
          <Field id="owner_name" label="Owner name">
            <input id="owner_name" value={form.owner_name} onChange={set('owner_name')} required minLength={2} className="input" />
          </Field>
          <Field id="email" label="Email" hint="Used to sign in.">
            <input id="email" type="email" value={form.email} onChange={set('email')} required className="input" />
          </Field>
          <Field id="phone" label="Phone">
            <input id="phone" type="tel" value={form.phone} onChange={set('phone')} className="input" />
          </Field>
          <div className="sm:col-span-2">
            <Field id="address" label="Address" hint="Optional. Shown on your customer menu.">
              <input id="address" value={form.address} onChange={set('address')} maxLength={200} className="input" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="description" label="Description" hint={`${form.description.length}/500. A short welcome line guests see above the menu.`}>
              <textarea id="description" rows={3} value={form.description} onChange={set('description')} maxLength={500} className="input" />
            </Field>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-6">
          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <section className="card mt-6" aria-labelledby="link-title">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 id="link-title" className="card-title">Customer menu link</h2>
          <p className="mt-1 text-sm text-slate-500">This is where your QR code sends guests. It only ever shows your menu.</p>
        </div>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:p-6">
          <input readOnly value={menuUrl} aria-label="Customer menu link" onFocus={(e) => e.target.select()} className="input flex-1 bg-slate-50 text-slate-600" />
          <button type="button" onClick={copyLink} className="btn btn-secondary">
            {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
          </button>
          <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            <ExternalLink size={16} /> Open
          </a>
        </div>
      </section>
    </div>
  );
}

export default Settings;
