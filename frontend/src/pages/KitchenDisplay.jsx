import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { SOCKET_URL } from '../utils/config';
import { Clock, CheckCircle2, ChefHat, AlertCircle, Maximize } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';

function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) {
        setOrders(res.data.data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const socket = io(SOCKET_URL);
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user && user.id) {
      socket.emit('join_restaurant', user.id);
      socket.on('new_order', (order) => {
        setOrders(prev => [...prev, order]);
        // Play sound ping here
        const audio = new Audio('/ping.mp3'); // Assuming ping.mp3 is in public folder
        audio.play().catch(e => console.log('Audio play failed', e));
      });
    }

    // Auto refresh local states every 10 seconds (for timers)
    const interval = setInterval(() => {
      setOrders(prev => [...prev]); // Trigger re-render to update times
    }, 10000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(orders.map(o => o._id === id ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Group orders by status
  const pendingOrders = orders.filter(o => ['pending', 'accepted'].includes(o.status));
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed' && differenceInMinutes(new Date(), new Date(o.updatedAt)) < 30); // Show completed for 30 mins

  const OrderCard = ({ order, nextAction, actionLabel, actionColor }) => {
    const minsOld = differenceInMinutes(new Date(), new Date(order.createdAt));
    let timeColor = 'text-slate-500';
    if (minsOld >= 30) timeColor = 'text-red-600 font-bold';
    else if (minsOld >= 15) timeColor = 'text-orange-500 font-bold';

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-2xl font-black text-slate-800">#{order.order_number}</h3>
            <span className="text-lg font-bold text-primary">{order.customer_name || `Table ${order.table_number || 'N/A'}`}</span>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-1 text-lg ${timeColor}`}>
              <Clock size={18} /> {minsOld}m
            </div>
            {minsOld >= 30 && <div className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> Rush</div>}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-xl font-black text-slate-800 bg-slate-100 px-2 rounded h-min">{item.quantity}</span>
              <div>
                <span className="text-lg font-bold text-slate-700">{item.item_name}</span>
                {item.special_instructions && (
                  <div className="text-sm font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded mt-1 uppercase border border-amber-200">
                    NOTE: {item.special_instructions}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {nextAction && (
          <button 
            onClick={() => updateOrderStatus(order._id, nextAction)}
            className={`w-full py-3 rounded-xl font-bold text-lg text-white shadow-md hover:shadow-lg transition-all active:scale-95 ${actionColor}`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-xl text-slate-500">Loading Kitchen Display...</div>;

  return (
    <div className="h-screen flex flex-col bg-slate-100 fixed inset-0 z-50 p-4">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 mb-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4">
          <ChefHat size={32} className="text-amber-400" />
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider">Kitchen Display</h1>
            <p className="text-sm text-slate-400 font-medium">Active Orders: {pendingOrders.length + preparingOrders.length + readyOrders.length}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-2xl font-black text-amber-400">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button onClick={toggleFullscreen} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white">
            <Maximize size={24} />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden">
        
        {/* Column 1: New */}
        <div className="flex flex-col bg-slate-200/50 rounded-2xl overflow-hidden border-t-4 border-t-orange-500">
          <div className="p-3 bg-white/50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 uppercase tracking-wide">New Orders</h2>
            <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-sm font-bold">{pendingOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {pendingOrders.map(order => (
              <OrderCard key={order._id} order={order} nextAction="preparing" actionLabel="Start Preparing" actionColor="bg-blue-600 hover:bg-blue-700" />
            ))}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="flex flex-col bg-slate-200/50 rounded-2xl overflow-hidden border-t-4 border-t-blue-500">
          <div className="p-3 bg-white/50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 uppercase tracking-wide">Preparing</h2>
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-sm font-bold">{preparingOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {preparingOrders.map(order => (
              <OrderCard key={order._id} order={order} nextAction="ready" actionLabel="Mark Ready" actionColor="bg-[#28a745] hover:bg-[#218838]" />
            ))}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="flex flex-col bg-slate-200/50 rounded-2xl overflow-hidden border-t-4 border-t-[#28a745]">
          <div className="p-3 bg-white/50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 uppercase tracking-wide">Ready for Pickup</h2>
            <span className="bg-[#28a745] text-white px-2 py-0.5 rounded-full text-sm font-bold">{readyOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {readyOrders.map(order => (
              <OrderCard key={order._id} order={order} nextAction="completed" actionLabel="Complete" actionColor="bg-slate-800 hover:bg-slate-900" />
            ))}
          </div>
        </div>

        {/* Column 4: Completed (Recent) */}
        <div className="flex flex-col bg-slate-200/50 rounded-2xl overflow-hidden border-t-4 border-t-slate-400">
          <div className="p-3 bg-white/50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-bold text-slate-700 uppercase tracking-wide">Completed</h2>
            <span className="bg-slate-400 text-white px-2 py-0.5 rounded-full text-sm font-bold">{completedOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 opacity-60 hover:opacity-100 transition-opacity">
            {completedOrders.map(order => (
              <OrderCard key={order._id} order={order} nextAction={null} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default KitchenDisplay;
