import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { NotificationCenter } from './components/NotificationCenter';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import { Trips } from './pages/Trips';
import { Maintenance } from './pages/Maintenance';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';

import { AccessControl } from './pages/AccessControl';

// ==========================================
// ROUTE PROTECTION & RBAC WRAPPERS
// ==========================================

interface RouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<RouteProps> = ({ children, allowedRoles }) => {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is not allowed, redirect to their default home view
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const roleMap: Record<string, string> = {
      'Driver': '/trips',
      'Safety Officer': '/drivers',
      'Financial Analyst': '/reports'
    };
    return <Navigate to={roleMap[currentUser.role] || '/'} replace />;
  }

  return children;
};

// ==========================================
// CORE SHELL LAYOUT
// ==========================================

const AppLayout: React.FC = () => {
  const { currentUser } = useApp();
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return 'Operations Dashboard';
      case '/vehicles':
        return 'Vehicle Registry';
      case '/drivers':
        return 'Driver Roster';
      case '/trips':
        return 'Dispatch Board';
      case '/maintenance':
        return 'Maintenance Logs';
      case '/expenses':
        return 'Operational Expenses';
      case '/reports':
        return 'Fleet Audits & ROI';
      case '/access-control':
        return 'Access Control';

    }
  };

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Collapsible/Sticky Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Main Panel Header */}
        <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 px-6 flex items-center justify-between z-35">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-xs tracking-wider uppercase">System</span>
            <span className="text-slate-455 font-bold text-xs">/</span>
            <span className="text-slate-800 dark:text-white font-bold text-xs">
              {getPageTitle(location.pathname)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Event notifications trigger */}
            <NotificationCenter />
            
            <div className="h-4.5 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Quick Profile Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-750 uppercase tracking-wide">
                {currentUser.role}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic page mount viewport */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vehicles" 
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager']}>
                  <Vehicles />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/drivers" 
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Safety Officer']}>
                  <Drivers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trips" 
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Driver']}>
                  <Trips />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/maintenance" 
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager']}>
                  <Maintenance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/expenses" 
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Driver', 'Financial Analyst']}>
                  <Expenses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/access-control" 
              element={
                <ProtectedRoute allowedRoles={['Fleet Manager']}>
                  <AccessControl />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// ==========================================
// BASE ENTRY WRAPPER
// ==========================================

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<AppLayout />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;
