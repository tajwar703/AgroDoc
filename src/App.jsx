import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import Result from "./pages/Result";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Order from "./pages/Order";
import ProductDetails from "./pages/ProductDetails";
import AgroAgency from "./pages/AgroAgency";
import WeatherAlert from "./pages/WeatherAlert";
import AddressBook from "./pages/AddressBook";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAgency from "./pages/admin/AdminAgency";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* Protected */}
            <Route path="/"                      element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/scanner"               element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
            <Route path="/result"                element={<ProtectedRoute><Result /></ProtectedRoute>} />
            <Route path="/history"               element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/profile"               element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/shop"                  element={<ProtectedRoute><Shop /></ProtectedRoute>} />
            <Route path="/cart"                  element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/checkout"              element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/orders"                element={<ProtectedRoute><Order /></ProtectedRoute>} />
            <Route path="/product/:id"           element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
            <Route path="/product-details/:id"   element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
            <Route path="/agro-agency"           element={<ProtectedRoute><AgroAgency /></ProtectedRoute>} />
            <Route path="/weather-alert"         element={<ProtectedRoute><WeatherAlert /></ProtectedRoute>} />
            <Route path="/address-book"          element={<ProtectedRoute><AddressBook /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin"                 element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/dashboard"       element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/agency"          element={<ProtectedRoute><AdminAgency /></ProtectedRoute>} />
            <Route path="/admin/orders"          element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/products"        element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/users"           element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}