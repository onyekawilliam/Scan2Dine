import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ChevronRight, XCircle } from 'lucide-react';
import Logo from '../components/Logo';
import api from '../utils/api';
import { money } from '../utils/format';

const STEPS = [
  { id: 'received', label: 'Order received', detail: 'The restaurant has your order.' },
  { id: 'preparing', label: 'Being prepared', detail: 'Your food is being made.' },
  { id: 'ready', label: 'Ready', detail: 'Your order is ready.' },
  { id: 'completed', label: 'Served', detail: 'Enjoy your meal!' },
];

// Maps the restaurant's detailed status onto the four steps a guest cares about.
const stepIndexOf = (status) => ({ pending: 0, accepted: 0, preparing: 1, ready: 2, completed: 3 }[status] ?? 0);
const isFinished = (status) => ['completed', 'cancelled'].includes(status);

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;
    let timer;

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/public/orders/${orderId}`);
        if (stopped) return;
        setOrder(res.data.data);
        // Keep checking every 10 seconds until the order is finished.
        if (!isFinished(res.data.data.status)) timer = setTimeout(fetchOrder, 10000);
      } catch {
        if (!stopped) timer = setTimeout(fetchOrder, 15000); // network blip: try again later
      } finally {
        if (!stopped) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId]);

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading your order…</div>;

  if (!order) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <Logo size="hero" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Order not found</h1>
          <p className="mt-1 text-sm text-slate-500">This link may be mistyped. Please ask the staff for help.</p>
        </div>
      </div>
    );
  }

  const cancelled = order.status === 'cancelled';
  const current = stepIndexOf(order.status);
  const completed = order.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-xl items-center px-4 sm:px-6">
          <Logo wordmark />
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-4 px-4 py-6 sm:px-6">
        <section className="card card-pad text-center">
          <div className={`mx-auto grid size-12 place-items-center rounded-full ${cancelled ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {cancelled ? <XCircle size={26} aria-hidden="true" /> : <Check size={26} aria-hidden="true" />}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            {cancelled ? 'Order cancelled' : completed ? 'Order served' : 'Order received'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {order.restaurant_name ? `${order.restaurant_name} · ` : ''}Order {order.order_number}
          </p>
          {cancelled && <p className="mt-3 text-sm text-slate-600">The restaurant could not prepare this order. Please speak to the staff.</p>}
        </section>

        {!cancelled && (
          <section className="card card-pad" aria-label="Order progress">
            <ol className="space-y-0">
              {STEPS.map((step, i) => {
                const done = i < current || completed;
                const active = i === current && !completed;
                return (
                  <li key={step.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${
                          done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-white ring-4 ring-primary/15' : 'bg-slate-100 text-slate-400'
                        }`}
                        aria-hidden="true"
                      >
                        {done ? <Check size={14} /> : i + 1}
                      </span>
                      {i < STEPS.length - 1 && <span className={`my-1 w-0.5 flex-1 ${done ? 'bg-emerald-500' : 'bg-slate-200'}`} aria-hidden="true" />}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-semibold ${done || active ? 'text-slate-900' : 'text-slate-400'}`} aria-current={active ? 'step' : undefined}>
                        {step.label}
                        {done && <span className="sr-only"> (done)</span>}
                      </p>
                      {active && <p className="mt-0.5 text-sm text-slate-500">{step.detail}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
            {!completed && <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">This page updates by itself. You can keep it open.</p>}
          </section>
        )}

        <section className="card card-pad" aria-label="Your order">
          <h2 className="card-title">Your order</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between gap-4 py-2">
                <span className="text-slate-700"><span className="mr-2 tabular-nums text-slate-400">{item.quantity}×</span>{item.item_name}</span>
                <span className="tabular-nums text-slate-900">{money(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
            {order.tax > 0 && (
              <>
                <div className="flex justify-between text-slate-500"><dt>Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
                <div className="flex justify-between text-slate-500"><dt>Tax</dt><dd className="tabular-nums">{money(order.tax)}</dd></div>
              </>
            )}
            <div className="flex justify-between text-base font-semibold text-slate-900"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
          </dl>
        </section>

        {order.restaurant_slug && (
          <Link to={`/menu/${order.restaurant_slug}`} className="btn btn-secondary w-full">
            Order more <ChevronRight size={16} />
          </Link>
        )}
      </main>
    </div>
  );
};

export default OrderTracking;
