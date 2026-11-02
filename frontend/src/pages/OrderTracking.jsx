import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, ChefHat, Package, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo';
import api from '../utils/api';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/public/orders/${orderId}`);
        if (res.data.success) {
          setOrder(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const steps = [
    { id: 'pending', label: 'Order Received', icon: CheckCircle2 },
    { id: 'preparing', label: 'Preparing', icon: ChefHat },
    { id: 'ready', label: 'Ready for Pickup', icon: Package },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  ];

  const currentStatus = order?.status || 'pending';
  const currentStepIndex = steps.findIndex(s => s.id === currentStatus);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading tracking info...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-slate-500">Order not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 relative overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 p-6 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-3">
           <Logo size="nav" />
           <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Scan2Dine</span>
         </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto mt-8 animate-fade-in-up">
        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100 text-center mb-8">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">
            {currentStatus === 'completed' ? 'Order Served!' : 'Order Confirmed!'}
          </h2>
          <p className="text-slate-500 font-medium">Order #{order.order_number}</p>
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl inline-block">
             <p className="text-sm font-bold text-slate-700">Total: ${order.total.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-8 border-b border-slate-100 pb-4">Live Tracking</h3>
          
          <div className="space-y-8 relative">
            {/* Connecting Line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-100"></div>

            {steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              const color = isPast ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-white ring-4 ring-primary/20' : 'bg-slate-100 text-slate-400';
              
              return (
                <div key={step.id} className="flex gap-6 relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${color} transition-all duration-500`}>
                    <step.icon size={20} />
                  </div>
                  <div className="pt-2">
                    <h4 className={`font-bold text-lg ${isActive || isPast ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</h4>
                    {isActive && (
                      <p className="text-primary font-medium text-sm mt-1 animate-pulse">
                        {step.id === 'ready' ? 'Your food is ready!' : 'Currently in progress...'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to={`/menu/${order.restaurant_id}`} className="text-primary font-bold hover:underline flex items-center justify-center gap-1">
             Order More Items <ChevronRight size={18} />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;
