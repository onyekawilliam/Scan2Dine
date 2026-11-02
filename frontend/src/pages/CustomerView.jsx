import React, { useState, useEffect } from 'react';
import { Star, ShoppingCart, Plus, Minus, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CustomerView = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Checkout State
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderError, setOrderError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get(`/public/menu/${restaurantId}`);
        if (res.data.success) {
          setRestaurant(res.data.data.restaurant);
          setCategories(res.data.data.categories);
          setMenuItems(res.data.data.items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [restaurantId]);

  const displayItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => {
        const catId = typeof item.category_id === 'object' ? item.category_id._id : item.category_id;
        return catId === activeCategory;
      });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item._id !== id));

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = async () => {
    setSubmitting(true);
    setOrderError('');
    try {
      const orderItems = cart.map(i => ({ menu_item_id: i._id, quantity: i.qty }));
      const payload = {
        restaurant_id: restaurant._id,
        table_number: tableNumber,
        customer_name: customerName,
        items: orderItems
      };
      
      const res = await api.post('/public/orders', payload);
      if (res.data.success) {
        setCart([]);
        setIsCartOpen(false);
        // Redirect to order tracking
        navigate(`/track/${res.data.data.order._id}`);
      }
    } catch (err) {
      console.error(err);
      setOrderError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'We could not place your order. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading Menu...</div>;
  if (!restaurant) return <div className="min-h-screen flex items-center justify-center text-slate-500">Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 relative overflow-x-hidden">
      
      {/* Toast Notification */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-emerald-500 text-white px-6 py-3 rounded-full font-medium shadow-lg flex items-center gap-2">
          <CheckCircle2 size={20} /> Added to cart
        </div>
      </div>

      {/* Header Section */}
      <header className="bg-gradient-to-r from-primary to-secondary pt-12 pb-8 px-6 text-center text-white relative shadow-md">
         <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px]"></div>
         <div className="relative z-10 animate-fade-in-up">
           <h1 className="text-3xl font-extrabold mb-1">{restaurant.restaurant_name}</h1>
           {restaurant.description && <p className="text-white/80 font-medium mb-4 max-w-md mx-auto">{restaurant.description}</p>}
           {restaurant.address && <p className="text-white/70 text-sm">{restaurant.address}</p>}
         </div>
      </header>

      {/* Category Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="flex overflow-x-auto py-4 px-6 gap-3 no-scrollbar max-w-4xl mx-auto">
          <button onClick={() => setActiveCategory('All')} className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === 'All' ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeCategory === cat._id ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {cat.emoji_icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <main className="p-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {displayItems.map((item, idx) => (
            <div key={item._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-in-up">
               <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-inner">
                 {item.emoji_icon || '🍽️'}
               </div>
               
               <div className="flex-1 flex flex-col">
                 <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h3>
                 <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{item.description}</p>
                 <div className="flex items-center justify-between mt-3">
                   <span className="font-bold text-primary text-lg">${item.price.toFixed(2)}</span>
                   {item.is_available !== false ? (
                     <button onClick={() => addToCart(item)} className="bg-slate-900 hover:bg-primary text-white p-2 rounded-xl transition-colors shadow-sm"><Plus size={20} /></button>
                   ) : (
                     <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Sold Out</span>
                   )}
                 </div>
               </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:scale-105 transition-transform flex items-center justify-center gap-3">
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-emerald-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
          </div>
          <span className="font-bold pr-2 hidden sm:block">${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Shopping Cart Sidebar */}
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}></div>
      
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShoppingCart className="text-primary" /> Your Order</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 bg-slate-200 text-slate-500 rounded-full hover:bg-slate-300"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
               <ShoppingCart size={64} className="opacity-20" />
               <p className="font-medium">Your cart is empty.</p>
             </div>
           ) : (
             cart.map(item => (
               <div key={item._id} className="flex items-center justify-between gap-4">
                 <div className="flex-1">
                   <h4 className="font-bold text-slate-800">{item.name}</h4>
                   <p className="text-primary font-bold">${(item.price * item.qty).toFixed(2)}</p>
                 </div>
                 <div className="flex items-center gap-3 bg-slate-100 rounded-full p-1">
                   <button onClick={() => updateQty(item._id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-600 shadow-sm"><Minus size={16} /></button>
                   <span className="font-bold text-slate-800 w-4 text-center">{item.qty}</span>
                   <button onClick={() => updateQty(item._id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-600 shadow-sm"><Plus size={16} /></button>
                 </div>
                 <button onClick={() => removeItem(item._id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><X size={20} /></button>
               </div>
             ))
           )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
           <div className="flex gap-4">
             <input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Table # (if dine-in)" className="w-1/3 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
             <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your Name" className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary" />
           </div>
           {orderError && (
             <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{orderError}</div>
           )}
           <div className="flex justify-between items-center pt-2">
             <span className="text-slate-500 font-medium">Total</span>
             <span className="text-3xl font-extrabold text-slate-800">${cartTotal.toFixed(2)}</span>
           </div>
           <button 
             disabled={cart.length === 0 || submitting}
             onClick={handleCheckout}
             className="w-full bg-gradient-to-r from-primary to-secondary disabled:from-slate-300 disabled:to-slate-400 text-white py-4 rounded-2xl font-bold shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
           >
             {submitting ? 'Processing...' : 'Place Order'} <ArrowRight size={20} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerView;
