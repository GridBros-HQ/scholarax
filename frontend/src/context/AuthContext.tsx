import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  name: string;
  role: 'SUPER_ADMIN' | 'CAMPUS_ADMIN' | 'TEACHER' | 'STUDENT';
}

interface AuthContextType {
  user: UserProfile | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  login: (token: string, tenantId: string, userProfile: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('scholarax_token');
    const savedTenant = localStorage.getItem('scholarax_tenant_id');
    if (token && savedTenant) {
      setIsAuthenticated(true);
      setTenantId(savedTenant);
    }
  }, []);

  const login = (token: string, selectedTenant: string, userProfile: UserProfile) => {
    localStorage.setItem('scholarax_token', token);
    localStorage.setItem('scholarax_tenant_id', selectedTenant);
    setTenantId(selectedTenant);
    setUser(userProfile);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setTenantId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, tenantId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};