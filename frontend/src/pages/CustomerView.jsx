import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import api from '../utils/api';
import { photoUrl } from '../utils/cloudinary';
import { money, errorMessage } from '../utils/format';
import Logo from '../components/Logo';

const MAX_QTY = 50;
const categoryIdOf = (item) => (typeof item.category_id === 'object' ? item.category_id?._id : item.category_id);

function Stepper({ qty, onChange, label }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label={`Remove one ${label}`} className="grid size-9 place-items-center text-slate-600 hover:bg-slate-50">
        {qty <= 1 ? <Trash2 size={15} /> : <Minus size={15} />}
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} disabled={qty >= MAX_QTY} aria-label={`Add one more ${label}`} className="grid size-9 place-items-center text-slate-600 hover:bg-slate-50 disabled:opacity-40">
        <Plus size={15} />
      </button>
    </div>
  );
}

const CustomerView = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState({}); // item id -> quantity
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [orderError, setOrderError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/public/menu/${restaurantId}`);
        setRestaurant(res.data.data.restaurant);
        setCategories(res.data.data.categories);
        setMenuItems(res.data.data.items);
      } catch (err) {
        setLoadError(err.response?.status === 404 ? 'notfound' : errorMessage(err, 'We could not load this menu.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  const cartKey = restaurant ? `s2d_cart_${restaurant._id}` : null;
  // Saving must wait until the saved cart has been read back, or it would overwrite it with an empty one.
  const [restoredKey, setRestoredKey] = useState(null);

  // Restore a saved cart once the menu is known, dropping anything that is gone or sold out.
  useEffect(() => {
    if (!cartKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '{}');
      const valid = {};
      menuItems.forEach((item) => {
        if (item.is_available !== false && saved[item._id] > 0) valid[item._id] = Math.min(saved[item._id], MAX_QTY);
      });
      setCart(valid);
    } catch {
      setCart({});
    }
    setRestoredKey(cartKey);
  }, [cartKey, menuItems]);

  useEffect(() => {
    if (!cartKey || restoredKey !== cartKey) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {
      // Private browsing may block storage: the cart simply will not survive a reload.
    }
  }, [cart, cartKey, restoredKey]);

  const setQty = (id, qty) =>
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, MAX_QTY);
      return next;
    });

  // Customers only see categories that actually have something on them.
  const visibleCategories = useMemo(
    () => categories.filter((cat) => menuItems.some((item) => categoryIdOf(item) === cat._id)),
    [categories, menuItems]
  );

  const groups = useMemo(() => {
    const shown = activeCategory === 'All' ? visibleCategories : visibleCategories.filter((c) => c._id === activeCategory);
    return shown.map((cat) => ({ cat, items: menuItems.filter((i) => categoryIdOf(i) === cat._id) }));
  }, [activeCategory, visibleCategories, menuItems]);

  const cartLines = menuItems.filter((item) => cart[item._id] > 0).map((item) => ({ item, qty: cart[item._id] }));
  const cartCount = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const cartTotal = cartLines.reduce((sum, l) => sum + l.item.price * l.qty, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (submitting || cartLines.length === 0) return;
    setSubmitting(true);
    setOrderError('');
    try {
      const res = await api.post('/public/orders', {
        restaurant_id: restaurant._id,
        table_number: tableNumber.trim(),
        customer_name: customerName.trim(),
        special_instructions: note.trim(),
        items: cartLines.map((l) => ({ menu_item_id: l.item._id, quantity: l.qty })),
      });
      if (res.data.success) {
        setCart({});
        setIsCartOpen(false);
        navigate(`/track/${res.data.data.order._id}`);
      }
    } catch (err) {
      setOrderError(errorMessage(err, 'We could not place your order. Please check your connection and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Loading menu…</div>;

  if (!restaurant) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <Logo size="hero" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">{loadError === 'notfound' ? 'Restaurant not found' : 'Menu unavailable'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loadError === 'notfound' ? 'This link may be mistyped or out of date. Please scan the QR code again.' : loadError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{restaurant.restaurant_name}</h1>
          {restaurant.description && <p className="mt-1.5 text-sm text-slate-600">{restaurant.description}</p>}
          {restaurant.address && <p className="mt-1 text-xs text-slate-400">{restaurant.address}</p>}
        </div>
      </header>

      {visibleCategories.length > 1 && (
        <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur" aria-label="Menu categories">
          <div className="no-scrollbar mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
            {[{ _id: 'All', name: 'All' }, ...visibleCategories].map((cat) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => setActiveCategory(cat._id)}
                aria-pressed={activeCategory === cat._id}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat._id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.emoji_icon ? `${cat.emoji_icon} ` : ''}{cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {menuItems.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">This restaurant has not added any dishes yet. Please check back soon.</p>
        ) : (
          groups.map(({ cat, items }) => (
            <section key={cat._id} className="mb-8" aria-labelledby={`cat-${cat._id}`}>
              <h2 id={`cat-${cat._id}`} className="mb-3 text-lg font-semibold text-slate-900">{cat.name}</h2>
              {cat.description && <p className="-mt-2 mb-3 text-sm text-slate-500">{cat.description}</p>}
              <ul className="space-y-3">
                {items.map((item) => {
                  const available = item.is_available !== false;
                  const qty = cart[item._id] || 0;
                  return (
                    <li key={item._id} className={`card flex gap-4 p-3 ${available ? '' : 'opacity-60'}`}>
                      <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-4xl sm:size-28">
                        {item.image_url
                          ? <img src={photoUrl(item.image_url, 240)} alt={item.name} loading="lazy" className="size-full object-cover" />
                          : <span aria-hidden="true">{item.emoji_icon || '🍽️'}</span>}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold leading-snug text-slate-900">{item.name}</h3>
                          <span className="shrink-0 text-base font-semibold tabular-nums text-slate-900">{money(item.price)}</span>
                        </div>
                        {item.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.description}</p>}

                        {(item.dietary_tags?.length > 0 || item.allergens?.length > 0) && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {item.dietary_tags?.map((tag) => <span key={tag} className="badge badge-ready">{tag}</span>)}
                            {item.allergens?.length > 0 && <span className="text-xs text-slate-500">Contains: {item.allergens.join(', ')}</span>}
                          </div>
                        )}

                        <div className="mt-auto flex justify-end pt-3">
                          {!available ? (
                            <span className="badge badge-cancelled">Sold out</span>
                          ) : qty > 0 ? (
                            <Stepper qty={qty} onChange={(n) => setQty(item._id, n)} label={item.name} />
                          ) : (
                            <button type="button" onClick={() => setQty(item._id, 1)} className="btn btn-primary btn-sm" aria-label={`Add ${item.name} to your order`}>
                              <Plus size={14} /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>

      {/* Order bar */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_12px_rgb(0_0_0/0.05)]">
          <button type="button" onClick={() => setIsCartOpen(true)} className="btn btn-primary btn-lg mx-auto flex w-full max-w-3xl justify-between">
            <span className="flex items-center gap-2"><ShoppingBag size={18} /> View order · {cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
            <span className="tabular-nums">{money(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Order sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Your order">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/50" onClick={() => setIsCartOpen(false)} />
          <form onSubmit={handleCheckout} className="animate-fade-in-up relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Your order</h2>
              <button type="button" onClick={() => setIsCartOpen(false)} aria-label="Close" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              <ul className="divide-y divide-slate-100">
                {cartLines.map(({ item, qty }) => (
                  <li key={item._id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm tabular-nums text-slate-500">{money(item.price * qty)}</p>
                    </div>
                    <Stepper qty={qty} onChange={(n) => setQty(item._id, n)} label={item.name} />
                  </li>
                ))}
              </ul>

              <div className="space-y-4 border-t border-slate-100 py-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="table" className="label">Table</label>
                    <input id="table" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} maxLength={20} inputMode="text" placeholder="e.g. 12" className="input" />
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="cname" className="label">Your name <span className="font-normal text-slate-400">(optional)</span></label>
                    <input id="cname" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={50} autoComplete="given-name" className="input" />
                  </div>
                </div>
                <div>
                  <label htmlFor="note" className="label">Note for the kitchen <span className="font-normal text-slate-400">(optional)</span></label>
                  <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Allergies, no onions, extra sauce…" className="input" />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500">Subtotal</span>
                <span className="text-xl font-semibold tabular-nums text-slate-900">{money(cartTotal)}</span>
              </div>
              {orderError && <p role="alert" className="alert-error">{orderError}</p>}
              <button type="submit" disabled={submitting || cartLines.length === 0} className="btn btn-primary btn-lg w-full">
                {submitting ? 'Placing order…' : 'Place order'}
              </button>
              <p className="text-center text-xs text-slate-400">Taxes, if any, are added when you place the order.</p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerView;
