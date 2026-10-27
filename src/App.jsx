import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './components/layouts/CustomerLayout';
import AdminLayout from './components/layouts/AdminLayout';
import Home from './pages/customer/Home';
import Design3D from './pages/customer/Design3D';
import OrderForm from './pages/customer/OrderForm';
import OrderStatus from './pages/customer/OrderStatus';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminDesigns from './pages/admin/AdminDesigns';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPayments from './pages/admin/AdminPayments';
import AdminOrderStatus from './pages/admin/AdminOrderStatus';
import AdminDesignPreview from './pages/admin/AdminDesignPreview';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';
import CustomerDashboard from './pages/customer/CustomerDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Customer Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="design" element={<Design3D />} />
          <Route path="order" element={<OrderForm />} />
          <Route path="status" element={<OrderStatus />} />
          <Route path="profile" element={<Profile />} />
          <Route path="preview/:id" element={<AdminDesignPreview />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/preview/:id" element={<AdminDesignPreview />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="status" element={<AdminOrderStatus />} />
          {/* Legacy routes, kept just in case */}
          <Route path="designs" element={<AdminDesigns />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
