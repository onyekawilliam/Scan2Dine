import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import LiveOrders from './pages/LiveOrders';
import AllOrders from './pages/AllOrders';
import MenuManagement from './pages/MenuManagement';
import AddMenuItem from './pages/AddMenuItem';
import CategoriesManagement from './pages/CategoriesManagement';
import Analytics from './pages/Analytics';
import KitchenDisplay from './pages/KitchenDisplay';
import QRGenerator from './pages/QRGenerator';
import Settings from './pages/Settings';
import CustomerView from './pages/CustomerView';
import OrderTracking from './pages/OrderTracking';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu/:restaurantId" element={<CustomerView />} />
        <Route path="/track/:orderId" element={<OrderTracking />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
