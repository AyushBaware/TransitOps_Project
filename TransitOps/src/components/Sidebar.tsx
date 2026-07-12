import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  MapPin, 
  Wrench, 
  Receipt, 
  FileBarChart, 
  LogOut, 
  Sun, 
  Moon,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser, logout, login } = useApp();
  const navigate = useNavigate();

  // Dark Mode Toggle helper
  const [darkMode, setDarkMode] = React.useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as any;
    if (currentUser) {
      login(currentUser.email, role);
      // Redirect based on role to prevent stranded routes
      if (role === 'Driver') {
        navigate('/trips');
      } else if (role === 'Safety Officer') {
        navigate('/drivers');
      } else if (role === 'Financial Analyst') {
        navigate('/reports');
      } else {
        navigate('/');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  const role = currentUser.role;

  // RBAC Access Control lists for sidebar links
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'] },
    { to: '/vehicles', label: 'Vehicles', icon: Truck, roles: ['Fleet Manager'] },
    { to: '/drivers', label: 'Drivers', icon: Users, roles: ['Fleet Manager', 'Safety Officer'] },
    { to: '/trips', label: 'Trips & Dispatch', icon: MapPin, roles: ['Fleet Manager', 'Driver'] },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['Fleet Manager'] },
    { to: '/expenses', label: 'Fuel & Expenses', icon: Receipt, roles: ['Fleet Manager', 'Driver', 'Financial Analyst'] },
    { to: '/reports', label: 'Reports & ROI', icon: FileBarChart, roles: ['Fleet Manager', 'Financial Analyst'] },
  ];

  const allowedLinks = links.filter(link => link.roles.includes(role));

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-100 flex flex-col justify-between shrink-0 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-805 flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-lg text-white">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-none">TransitOps</h1>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase">Logistics Core</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-805 rounded-lg flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 border border-blue-500/20 font-bold text-sm shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900 dark:text-white leading-tight">{currentUser.name}</p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wide flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Demo Switch Role
            </label>
            <div className="relative">
              <select
                id="demo-role-selector"
                value={role}
                onChange={handleRoleChange}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Driver">Driver</option>
                <option value="Safety Officer">Safety Officer</option>
                <option value="Financial Analyst">Financial Analyst</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-4">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 block mb-2">
            Operations Menu
          </span>
          <nav className="flex flex-col gap-1">
            {allowedLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-900/20' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="h-4.5 w-4.5" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Settings & Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {darkMode ? 'Light Theme' : 'Dark Theme'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {darkMode ? 'DARK' : 'LIGHT'}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-xs font-medium text-red-650 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20 border border-transparent dark:hover:border-red-900/30 rounded-lg transition-colors text-left cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
          Log Out System
        </button>
      </div>
    </aside>
  );
};
