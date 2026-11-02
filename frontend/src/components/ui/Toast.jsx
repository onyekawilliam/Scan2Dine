import React, { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext } from './toastContext';

const STYLES = {
  success: { icon: CheckCircle2, color: 'text-emerald-600' },
  error: { icon: AlertCircle, color: 'text-red-600' },
  info: { icon: Info, color: 'text-primary' },
};

let nextId = 1;

// Replaces browser alert(): small, non-blocking messages that fade away on their own.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, kind = 'info') => {
      const id = nextId++;
      setToasts((all) => [...all, { id, message, kind }].slice(-4));
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info'),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6" role="status" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, color } = STYLES[t.kind];
          return (
            <div key={t.id} className="animate-fade-in-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg">
              <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
              <p className="flex-1 text-sm text-slate-700">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
