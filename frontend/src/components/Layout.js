import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  House, 
  Users, 
  UserCircle, 
  Handshake, 
  Wallet, 
  CheckSquare, 
  UsersThree, 
  Gear, 
  SignOut,
  Bell,
  Car
} from '@phosphor-icons/react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: House, label: 'Дашборд' },
    { path: '/leads', icon: Users, label: 'Ліди' },
    { path: '/customers', icon: UserCircle, label: 'Клієнти' },
    { path: '/deals', icon: Handshake, label: 'Угоди' },
    { path: '/deposits', icon: Wallet, label: 'Депозити' },
    { path: '/tasks', icon: CheckSquare, label: 'Завдання' },
    { path: '/staff', icon: UsersThree, label: 'Команда' },
    { path: '/settings', icon: Gear, label: 'Налаштування' },
  ];

  const roleLabels = {
    master_admin: 'Головний адмін',
    admin: 'Адміністратор',
    moderator: 'Модератор',
    manager: 'Менеджер',
    finance: 'Фінанси'
  };

  return (
    <div className="flex h-screen bg-[#F7F7F8]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#D4D4D8] flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-[#D4D4D8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0A0A0B] flex items-center justify-center">
              <Car size={20} weight="bold" className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              AutoCRM
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4" data-testid="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <Icon size={20} weight={path === '/' ? 'fill' : 'regular'} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-[#D4D4D8]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#E4E4E7] rounded-full flex items-center justify-center text-sm font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-[#71717A]">{roleLabels[user?.role] || user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#71717A] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
            data-testid="logout-btn"
          >
            <SignOut size={18} />
            <span>Вийти</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-[#D4D4D8] flex items-center justify-between px-6">
          <div></div>
          <div className="flex items-center gap-4">
            <button 
              className="relative p-2 text-[#71717A] hover:text-[#0A0A0B] hover:bg-[#F4F4F5] transition-colors"
              data-testid="notifications-btn"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
