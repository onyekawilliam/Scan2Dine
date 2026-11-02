import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ChefHat, Circle, Plus, Printer, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { SOCKET_URL } from '../utils/config';
import { money, errorMessage } from '../utils/format';
import { printOrderSlip } from '../utils/printOrder';
import { statusInfo, isActiveStatus } from '../constants/orderStatus';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import { useToast } from '../components/ui/toastContext';

function Stat({ label, value, hint }) {
  return (
    <div className="card card-pad">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// Shown to a brand-new restaurant until it has a category and at least one item.
function SetupChecklist({ hasCategory, hasItems }) {
  const steps = [
    { done: hasCategory, title: 'Create a category', text: 'Group your dishes, like Starters or Drinks.', to: '/dashboard/categories', cta: 'Add category' },
    { done: hasItems, title: 'Add your first menu item', text: 'A name and a price is enough to start. Photos are optional.', to: '/dashboard/menu/add', cta: 'Add item' },
    { done: false, title: 'Print your QR code', text: 'Put it on tables so guests can scan and order.', to: '/dashboard/qr', cta: 'Get QR code' },
  ];
  const next = steps.findIndex((s) => !s.done);

  return (
    <section className="card card-pad mb-6" aria-labelledby="setup-title">
      <h2 id="setup-title" className="card-title">Get your restaurant ready</h2>
      <p className="mt-1 text-sm text-slate-500">Three steps and guests can start ordering.</p>
      <ol className="mt-4 divide-y divide-slate-100">
        {steps.map((step, i) => (
          <li key={step.title} className="flex items-center gap-4 py-3">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full ${step.done ? 'bg-emerald-100 text-emerald-600' : i === next ? 'bg-primary-soft text-primary' : 'bg-slate-100 text-slate-400'}`}
              aria-hidden="true"
            >
              {step.done ? <Check size={15} /> : <Circle size={10} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{step.title}</p>
              <p className="text-xs text-slate-500">{step.text}</p>
            </div>
            {!step.done && (
              <Link to={step.to} className={`btn btn-sm ${i === next ? 'btn-primary' : 'btn-secondary'}`}>{step.cta}</Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function LiveOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [categoryCount, setCategoryCount] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) setOrders(res.data.data.orders);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not load orders.'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchOverview = useCallback(async () => {
    try {
      const [statsRes, catRes] = await Promise.all([api.get('/analytics/dashboard'), api.get('/menu/categories')]);
      setStats(statsRes.data.data);
      setCategoryCount((catRes.data.data.categories || catRes.data.data).length);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchOverview();

    // The server only lets a socket with a valid staff token join its own restaurant's room.
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    socket.on('connect', () => socket.emit('join_restaurant'));

    socket.on('new_order', (order) => {
      setOrders((prev) => (prev.some((o) => o._id === order._id) ? prev : [order, ...prev]));
      toast.info(`New order ${order.order_number}`);
      fetchOverview();
    });

    // Keeps several staff devices in sync when one of them changes an order.
    socket.on('order_updated', ({ id, status }) => {
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      fetchOverview();
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeStatus = async (order, status) => {
    if (busy) return;
    setBusy(true);
    try {
      await api.put(`/orders/${order._id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status } : o)));
      fetchOverview();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this order.'));
      fetchOrders(); // it was probably changed from another device: show the real state
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = (order) => {
    if (window.confirm(`Cancel order ${order.order_number}? The customer will see that it was cancelled.`)) {
      changeStatus(order, 'cancelled');
    }
  };

  const print = (order) => {
    if (!printOrderSlip(order)) toast.error('Your browser blocked the print window. Allow pop-ups for this site and try again.');
  };

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">Loading orders…</p>;

  const activeOrders = orders.filter((o) => isActiveStatus(o.status));
  const selected = orders.find((o) => o._id === selectedId) || null;
  const today = stats?.daily?.[stats.daily.length - 1];
  const needsSetup = stats && categoryCount !== null && (categoryCount === 0 || stats.menu_items_count === 0);

  return (
    <div>
      <PageHeader title="Live orders" description="New orders appear here the moment a guest places them.">
        <Link to="/dashboard/menu/add" className="btn btn-secondary"><Plus size={16} /> Add menu item</Link>
        <Link to="/dashboard/kitchen" className="btn btn-primary"><ChefHat size={16} /> Kitchen display</Link>
      </PageHeader>

      {needsSetup && <SetupChecklist hasCategory={categoryCount > 0} hasItems={stats.menu_items_count > 0} />}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active orders" value={activeOrders.length} hint="Waiting or in progress" />
        <Stat label="Orders today" value={today ? today.orders : 0} hint="Cancelled not counted" />
        <Stat label="Revenue today" value={money(today ? today.revenue : 0)} hint="Cancelled not counted" />
        <Stat label="Items on menu" value={stats ? stats.menu_items_count : 0} hint="Available to order" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Order list */}
        <section className="card lg:col-span-2" aria-label="Active orders">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="card-title">Active orders</h2>
            <Link to="/dashboard/orders" className="text-sm font-medium text-primary hover:underline">View history</Link>
          </div>

          {activeOrders.length === 0 ? (
            <EmptyState icon={Bell} title="No active orders" description="When a guest scans your QR code and orders, it will show up here instantly.">
              <Link to="/dashboard/qr" className="btn btn-secondary btn-sm">Get your QR code</Link>
            </EmptyState>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
              {activeOrders.map((order) => (
                <li key={order._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(order._id)}
                    aria-pressed={selectedId === order._id}
                    className={`block w-full px-5 py-4 text-left transition-colors ${selectedId === order._id ? 'bg-primary-soft' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-900">{order.order_number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-600">{order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}</p>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {order.table_number ? `Table ${order.table_number} · ` : ''}
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900">{money(order.total)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Order detail */}
        <section className="card lg:col-span-3" aria-label="Order details">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">{selected.order_number}</h2>
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {selected.customer_name ? `${selected.customer_name} · ` : ''}
                    {selected.table_number ? `Table ${selected.table_number}` : 'No table given'} ·{' '}
                    {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => print(selected)} className="btn btn-ghost btn-sm"><Printer size={15} /> Print</button>
                  <button type="button" onClick={() => setSelectedId(null)} aria-label="Close details" className="btn btn-ghost btn-sm !px-2"><X size={16} /></button>
                </div>
              </div>

              <ul className="divide-y divide-slate-100 px-5">
                {selected.items.map((item, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900"><span className="mr-2 tabular-nums text-slate-500">{item.quantity}×</span>{item.item_name}</p>
                      {item.special_instructions && <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">Note: {item.special_instructions}</p>}
                    </div>
                    <span className="text-sm tabular-nums text-slate-700">{money(item.subtotal)}</span>
                  </li>
                ))}
              </ul>

              {selected.special_instructions && (
                <p className="mx-5 mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Order note: {selected.special_instructions}</p>
              )}

              <dl className="space-y-1 border-t border-slate-200 px-5 py-4 text-sm">
                <div className="flex justify-between text-slate-500"><dt>Subtotal</dt><dd className="tabular-nums">{money(selected.subtotal)}</dd></div>
                <div className="flex justify-between text-slate-500"><dt>Tax</dt><dd className="tabular-nums">{money(selected.tax)}</dd></div>
                <div className="flex justify-between text-base font-semibold text-slate-900"><dt>Total</dt><dd className="tabular-nums">{money(selected.total)}</dd></div>
              </dl>

              {isActiveStatus(selected.status) && (
                <div className="flex gap-3 border-t border-slate-200 px-5 py-4">
                  {statusInfo(selected.status).next && (
                    <button type="button" disabled={busy} onClick={() => changeStatus(selected, statusInfo(selected.status).next)} className="btn btn-primary flex-1">
                      {statusInfo(selected.status).action}
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => cancelOrder(selected)} className="btn btn-danger">Cancel order</button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState icon={Bell} title="Select an order" description="Choose an order from the list to see what was ordered and move it forward." />
          )}
        </section>
      </div>
    </div>
  );
}

export default LiveOrders;
