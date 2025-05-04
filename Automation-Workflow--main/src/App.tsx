import React, { createContext, useContext } from 'react';
import { Navigate, BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './components/landing/LandingPage';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkflowBuilder } from './components/workflow/WorkflowBuilder';
import { AuthCallback } from './components/auth/AuthCallback';
import { Toaster } from 'react-hot-toast';

// Create Auth Context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Auth Context Hook
export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component with navigation logic
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#17252A] via-[#2B7A78] to-[#17252A] flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-[#3AAFA9]/20">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-[#3AAFA9] border-t-transparent rounded-full animate-spin" />
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login onLogin={(token: string) => login(token)} />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/workflow/edit/:id" 
        element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} 
      />
      <Route 
        path="/workflow/create" 
        element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} 
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
        <AppRoutes />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#3AAFA9',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4b4b',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;