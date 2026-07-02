import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import OrderHistory from './pages/OrderHistory';
import OrderTracking from './pages/OrderTracking';
import OrderConfirmed from './pages/OrderConfirmed';
import AdminDashboard from './pages/admin/Dashboard';
import MenuManagement from './pages/admin/MenuManagement';
import OrderManagement from './pages/admin/OrderManagement';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <Home />
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <OrderHistory />
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <OrderTracking />
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-confirmed/:id"
                element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <OrderConfirmed />
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <>
                      <Navbar />
                      <AdminDashboard />
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/menu"
                element={
                  <ProtectedRoute adminOnly>
                    <>
                      <Navbar />
                      <MenuManagement />
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute adminOnly>
                    <>
                      <Navbar />
                      <OrderManagement />
                    </>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
