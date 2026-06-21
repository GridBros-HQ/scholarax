import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const LoginPlaceholder = () => <div className="p-8 text-center text-xl font-bold text-slate-700">Portal Login Screen</div>;
const DashboardPlaceholder = () => <div className="p-8 text-center text-xl font-bold text-emerald-600">Campus Management Dashboard</div>;
const UnauthorizedPlaceholder = () => <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPlaceholder />} />
          <Route path="/unauthorized" element={<UnauthorizedPlaceholder />} />

          {/* Secure Routes Guard */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPlaceholder />} />
          </Route>

          {/* Route Catch-All Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;