import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiUsers, FiGrid, FiCircle, FiDollarSign, FiBox, FiTrendingUp,
  FiLogOut, FiMenu, FiX, FiChevronLeft, FiChevronRight, FiShoppingCart,
  FiTrendingUp as FiBarChart
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: FiBarChart, label: 'Dashboard' },
    { path: '/employees', icon: FiUsers, label: 'Employees' },
    { path: '/categories', icon: FiGrid, label: 'Categories' },
    { path: '/karats', icon: FiCircle, label: 'Karats' },
    { path: '/pricing', icon: FiDollarSign, label: 'Pricing' },
    { path: '/inventory', icon: FiBox, label: 'Inventory' },
    { path: '/sales', icon: FiTrendingUp, label: 'Sales' },
  ];

  return (
    <div className="flex h-screen bg-primary">
      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        flex flex-col
        bg-primary text-white transition-all duration-300 border-r border-secondary
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-secondary">
          {!collapsed && user && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-lg">{user.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div>
                <h1 className="font-bold text-gold truncate">{user.full_name}</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="p-2 hover:bg-secondary rounded-lg hidden lg:block"
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-2 hover:bg-secondary rounded-lg lg:hidden"
          >
            <FiX />
          </button>
        </div>

        {/* Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto mt-6 px-3 pb-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3 mb-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-gold text-primary font-semibold' 
                  : 'text-gray-400 hover:bg-secondary hover:text-white'
                }
              `}
            >
              <item.icon className={`text-xl ${collapsed ? 'mx-auto' : 'mr-3'}`} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-secondary">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all"
          >
            <FiLogOut className={`text-xl ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-secondary shadow-sm px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-between">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 hover:bg-primary rounded-lg text-white"
          >
            <FiMenu size={24} />
          </button>
          <div className="flex items-center space-x-2 lg:space-x-4 ml-auto">
            <span className="text-sm text-gray-300 hidden sm:block truncate max-w-[150px]">
              {user?.full_name || 'User'}
            </span>
            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gold rounded-full flex items-center justify-center">
              <span className="text-primary font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 lg:p-6 bg-primary">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;