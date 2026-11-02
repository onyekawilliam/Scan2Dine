import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ChefHat, ListOrdered, MenuSquare, Tags, QrCode, TrendingUp, Settings, LogOut, Menu, X, ExternalLink,
} from 'lucide-react';
import Logo from '../components/Logo';

const NAV = [
  {
    heading: 'Orders',
    items: [
      { name: 'Live orders', path: '/dashboard', icon: LayoutDashboard, end: true },
      { name: 'Kitchen display', path: '/dashboard/kitchen', icon: ChefHat },
      { name: 'Order history', path: '/dashboard/orders', icon: ListOrdered },
    ],
  },
  {
    heading: 'Menu',
    items: [
      { name: 'Menu items', path: '/dashboard/menu', icon: MenuSquare },
      { name: 'Categories', path: '/dashboard/categories', icon: Tags },
      { name: 'QR code', path: '/dashboard/qr', icon: QrCode },
    ],
  },
  {
    heading: 'Business',
    items: [
      { name: 'Analytics', path: '/dashboard/analytics', icon: TrendingUp },
      { name: 'Settings', path: '/dashboard/settings', icon: Settings },
    ],
  },
];

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    return {};
  }
};

function SidebarContent({ user, onNavigate, onLogout }) {
  const menuHref = `/menu/${user.slug || user.id || ''}`;
  const initial = (user.restaurant_name || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <Logo wordmark />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Dashboard">
        {NAV.map((group) => (
          <div key={group.heading}>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-slate-400">{group.heading}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary-soft text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon size={18} aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-3">
        <a
          href={menuHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ExternalLink size={18} aria-hidden="true" />
          View customer menu
        </a>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary" aria-hidden="true">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user.restaurant_name || 'Your restaurant'}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <button type="button" onClick={onLogout} aria-label="Log out" title="Log out" className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = readUser();

  // Close the phone drawer whenever the page changes.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* Phone and tablet: top bar and slide-in drawer */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Logo wordmark />
        <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="btn btn-ghost size-10 !px-0">
          <Menu size={22} />
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawerOpen(false)} />
          <div className="animate-fade-in-up absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-xl">
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 rounded-md p-2 text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
            <SidebarContent user={user} onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
