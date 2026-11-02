import React, { useState, useEffect } from 'react';
import { Plus, QrCode, TrendingUp, Settings, ChevronRight, X, Printer, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { SOCKET_URL } from '../utils/config';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';

function LiveOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

    // WebSocket connection for real-time orders
    const socket = io(SOCKET_URL);
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (user && user.id) {
      socket.emit('join_restaurant', user.id);
      
      socket.on('new_order', (order) => {
        setOrders(prev => [order, ...prev]);
        // Sound notification could go here
      });
    }

    return () => socket.disconnect();
  }, []);

  const updateOrderStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(orders.map(o => o._id === id ? { ...o, status } : o));
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ready': return 'bg-gradient-to-r from-[#28a745] to-[#20c997] text-white';
      case 'preparing': return 'bg-gradient-to-r from-primary to-secondary text-white';
      case 'pending': return 'bg-gradient-to-r from-[#ffc107] to-[#ff9800] text-white';
      case 'completed': return 'bg-slate-200 text-slate-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading orders...</div>;

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      
      {/* Left Sidebar: Recent Orders List */}
      <div className="w-full md:w-1/3 flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Recent Orders</h2>
          <Link to="/dashboard/orders" className="text-sm font-medium text-primary hover:underline">View All</Link>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell size={48} className="mx-auto mb-3 opacity-20" />
              <p>No active orders right now</p>
            </div>
          ) : (
            activeOrders.map(order => (
              <div 
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder?._id === order._id ? 'border-primary shadow-md bg-primary/5' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-slate-800">{order.order_number}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="text-sm text-slate-600 mb-2 truncate">
                  {order.items.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </span>
                  <span className="font-bold text-green-600">${order.total.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Center: Order Details Panel */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        {selectedOrder ? (
          <div className="flex-1 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden flex flex-col relative animate-fade-in-up">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full">
              <X size={18} />
            </button>

            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{selectedOrder.order_number}</h2>
                <p className="text-slate-500 text-sm">
                  {selectedOrder.customer_name ? `Customer: ${selectedOrder.customer_name}` : `Table: ${selectedOrder.table_number || 'N/A'}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                  <Printer size={16} /> Print
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                    <div>
                      <div className="font-medium text-slate-800"><span className="text-primary mr-2">{item.quantity}x</span> {item.item_name}</div>
                      {item.special_instructions && (
                        <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-block">
                          Note: {item.special_instructions}
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-slate-700">${item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${selectedOrder.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Tax</span><span>${selectedOrder.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-xl text-slate-800 mt-2 pt-2 border-t border-slate-100">
                  <span>Total</span><span className="text-green-600">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3">
              {selectedOrder.status === 'pending' && (
                <button onClick={() => updateOrderStatus(selectedOrder._id, 'accepted')} className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Accept Order
                </button>
              )}
              {selectedOrder.status === 'accepted' && (
                <button onClick={() => updateOrderStatus(selectedOrder._id, 'preparing')} className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Mark Preparing
                </button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button onClick={() => updateOrderStatus(selectedOrder._id, 'ready')} className="flex-1 bg-gradient-to-r from-[#28a745] to-[#20c997] text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Mark Ready
                </button>
              )}
              {selectedOrder.status === 'ready' && (
                <button onClick={() => updateOrderStatus(selectedOrder._id, 'completed')} className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Complete Order
                </button>
              )}
              <button onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')} className="px-6 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 py-3 rounded-xl font-bold transition-all">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 border-dashed">
            <div className="text-center text-slate-400">
              <p className="text-lg font-medium">Select an order to view details</p>
            </div>
          </div>
        )}

        {/* Right Quick Actions (Horizontal row below center or right side if space) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/dashboard/menu" className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-xl font-medium shadow-lg hover:scale-[1.02] transition-transform">
            <Plus size={18} /> Add Item
          </Link>
          <Link to="/dashboard/qr" className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-xl font-medium shadow-lg hover:scale-[1.02] transition-transform">
            <QrCode size={18} /> Get QR
          </Link>
          <Link to="/dashboard/analytics" className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6c757d] to-[#495057] text-white p-4 rounded-xl font-medium shadow-lg hover:scale-[1.02] transition-transform">
            <TrendingUp size={18} /> Analytics
          </Link>
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#6c757d] to-[#495057] text-white p-4 rounded-xl font-medium shadow-lg hover:scale-[1.02] transition-transform">
            <Settings size={18} /> Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveOrders;
