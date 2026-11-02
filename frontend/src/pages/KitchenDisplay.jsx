import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, ChefHat, Clock, Maximize, Volume2, VolumeX } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import api from '../utils/api';
import { SOCKET_URL } from '../utils/config';
import { errorMessage } from '../utils/format';
import { useToast } from '../components/ui/toastContext';

const COLUMNS = [
  { key: 'new', title: 'New', dot: 'bg-amber-500', match: (o) => ['pending', 'accepted'].includes(o.status), next: 'preparing', action: 'Start preparing' },
  { key: 'preparing', title: 'Preparing', dot: 'bg-indigo-500', match: (o) => o.status === 'preparing', next: 'ready', action: 'Mark ready' },
  { key: 'ready', title: 'Ready', dot: 'bg-emerald-500', match: (o) => o.status === 'ready', next: 'completed', action: 'Complete' },
  { key: 'done', title: 'Done (last 30 min)', dot: 'bg-slate-400', match: (o) => o.status === 'completed' && differenceInMinutes(new Date(), new Date(o.updatedAt)) < 30, next: null, action: null },
];

// A short two-tone beep made in the browser, so no sound file is needed.
function beep(audioCtx) {
  try {
    [880, 1175].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.18 + 0.15);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + i * 0.18);
      osc.stop(audioCtx.currentTime + i * 0.18 + 0.16);
    });
  } catch {
    // Sound is a nice-to-have; never let it break the screen.
  }
}

function OrderCard({ order, next, action, onAdvance }) {
  const mins = differenceInMinutes(new Date(), new Date(order.createdAt));
  const ageColor = mins >= 30 ? 'text-red-600' : mins >= 15 ? 'text-amber-600' : 'text-slate-500';

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">{order.order_number}</h3>
          <p className="truncate text-sm text-slate-500">
            {order.table_number ? `Table ${order.table_number}` : 'No table'}
            {order.customer_name ? ` · ${order.customer_name}` : ''}
          </p>
        </div>
        <span className={`flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums ${ageColor}`}>
          <Clock size={15} aria-hidden="true" /> {mins} min
        </span>
      </header>

      <ul className="space-y-2 py-3">
        {order.items.map((item, idx) => (
          <li key={idx} className="flex gap-3">
            <span className="grid h-7 min-w-7 place-items-center rounded-md bg-slate-100 px-1.5 text-sm font-semibold tabular-nums text-slate-800">{item.quantity}</span>
            <div className="min-w-0">
              <p className="text-base font-medium text-slate-900">{item.item_name}</p>
              {item.special_instructions && (
                <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-sm font-medium text-amber-800">{item.special_instructions}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {order.special_instructions && (
        <p className="mb-3 rounded bg-amber-50 px-2 py-1 text-sm font-medium text-amber-800">Order note: {order.special_instructions}</p>
      )}

      {next && (
        <button type="button" onClick={() => onAdvance(order._id, next)} className="btn btn-primary btn-lg w-full">
          {action}
        </button>
      )}
    </article>
  );
}

function KitchenDisplay() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [now, setNow] = useState(new Date());
  const audioRef = useRef(null);
  const soundRef = useRef(false);

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

  useEffect(() => {
    fetchOrders();

    // The server only lets a socket with a valid staff token join its own restaurant's room.
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    socket.on('connect', () => socket.emit('join_restaurant'));
    socket.on('new_order', (order) => {
      setOrders((prev) => (prev.some((o) => o._id === order._id) ? prev : [...prev, order]));
      if (soundRef.current && audioRef.current) beep(audioRef.current);
    });
    socket.on('order_updated', ({ id, status }) => {
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)));
    });

    // Ticks the clock and the "minutes waiting" counters.
    const tick = setInterval(() => setNow(new Date()), 20000);

    return () => {
      socket.disconnect();
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o)));
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update this order.'));
      fetchOrders(); // it was probably changed from another device: show the real state
    }
  };

  // Browsers only allow sound after a click, so sound is switched on by the user.
  const toggleSound = () => {
    if (!soundOn) {
      audioRef.current = audioRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioRef.current.resume?.();
      beep(audioRef.current); // so they hear what it will sound like
    }
    soundRef.current = !soundOn;
    setSoundOn(!soundOn);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => toast.error('Full screen is not available in this browser.'));
  };

  if (loading) return <p className="py-16 text-center text-sm text-slate-500">Loading kitchen display…</p>;

  const activeCount = orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)).length;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-100 p-4" data-now={now.getTime()}>
      <header className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="btn btn-sm !bg-slate-800 text-slate-200 hover:!bg-slate-700" aria-label="Back to dashboard">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <ChefHat size={24} className="hidden text-slate-400 sm:block" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Kitchen display</h1>
            <p className="text-xs text-slate-400">{activeCount} active {activeCount === 1 ? 'order' : 'orders'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-2 hidden text-xl font-semibold tabular-nums sm:block">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button type="button" onClick={toggleSound} aria-pressed={soundOn} className="btn btn-sm !bg-slate-800 text-slate-200 hover:!bg-slate-700">
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} {soundOn ? 'Sound on' : 'Sound off'}
          </button>
          <button type="button" onClick={toggleFullscreen} aria-label="Toggle full screen" className="btn btn-sm !bg-slate-800 text-slate-200 hover:!bg-slate-700 !px-2.5">
            <Maximize size={16} />
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-2 xl:grid-cols-4 xl:overflow-hidden">
        {COLUMNS.map((col) => {
          const list = orders.filter(col.match);
          return (
            <section key={col.key} className="flex min-h-48 flex-col rounded-2xl bg-slate-200/60" aria-label={col.title}>
              <div className="flex items-center justify-between px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <span className={`size-2.5 rounded-full ${col.dot}`} aria-hidden="true" /> {col.title}
                </h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">{list.length}</span>
              </div>
              <div className={`flex-1 space-y-3 overflow-y-auto px-3 pb-3 ${col.key === 'done' ? 'opacity-70' : ''}`}>
                {list.length === 0 && <p className="px-1 py-6 text-center text-sm text-slate-400">Nothing here</p>}
                {list.map((order) => (
                  <OrderCard key={order._id} order={order} next={col.next} action={col.action} onAdvance={advance} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default KitchenDisplay;
