import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';
import CustomerView from './pages/CustomerView';
import OrderTracking from './pages/OrderTracking';

// The owner dashboard (charts, drag and drop, tables) is loaded only when an owner opens it,
// so guests scanning a QR code on a phone download far less.
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'));
const LiveOrders = lazy(() => import('./pages/LiveOrders'));
const AllOrders = lazy(() => import('./pages/AllOrders'));
const MenuManagement = lazy(() => import('./pages/MenuManagement'));
const AddMenuItem = lazy(() => import('./pages/AddMenuItem'));
const CategoriesManagement = lazy(() => import('./pages/CategoriesManagement'));
const Analytics = lazy(() => import('./pages/Analytics'));
const KitchenDisplay = lazy(() => import('./pages/KitchenDisplay'));
const QRGenerator = lazy(() => import('./pages/QRGenerator'));
const Settings = lazy(() => import('./pages/Settings'));

const Loading = () => <p className="py-16 text-center text-sm text-slate-500">Loading…</p>;

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">This page does not exist</h1>
        <p className="mt-2 text-sm text-slate-500">The link may be mistyped or out of date.</p>
        <Link to="/" className="btn btn-primary mt-6">Go to the home page</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/menu/:restaurantId" element={<CustomerView />} />
          <Route path="/track/:orderId" element={<OrderTracking />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<LiveOrders />} />
            <Route path="kitchen" element={<KitchenDisplay />} />
            <Route path="orders" element={<AllOrders />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="menu/add" element={<AddMenuItem />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="qr" element={<QRGenerator />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
