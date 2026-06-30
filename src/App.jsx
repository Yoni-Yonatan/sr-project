import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Employees from './pages/Employees';
import Categories from './pages/Categories';
import Karats from './pages/Karats';
import Pricing from './pages/Pricing';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="employees" element={<Employees />} />
        <Route path="categories" element={<Categories />} />
        <Route path="karats" element={<Karats />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<Sales />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;