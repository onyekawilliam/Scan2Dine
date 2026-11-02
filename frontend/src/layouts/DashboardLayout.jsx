import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, MenuSquare, Tags, QrCode, TrendingUp, Settings, LogOut } from 'lucide-react';
import Logo from '../components/Logo';

const DashboardLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const navItems = [
    { name: 'Live Orders', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Kitchen Display', path: '/dashboard/kitchen', icon: LayoutDashboard },
    { name: 'All Orders', path: '/dashboard/orders', icon: ListOrdered },
    { name: 'Menu', path: '/dashboard/menu', icon: MenuSquare },
    { name: 'Categories', path: '/dashboard/categories', icon: Tags },
    { name: 'QR Codes', path: '/dashboard/qr', icon: QrCode },
    { name: 'Analytics', path: '/dashboard/analytics', icon: TrendingUp },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <Logo size="nav" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Scan2Dine</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-x-hidden min-w-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-200/40 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
