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
  Car,
  MagnifyingGlass
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
    <div className="flex h-screen bg-[#0A0B0F]">
      {/* Sidebar */}
      <aside className="sidebar-premium">
        {/* Logo */}
        <div className="px-4 py-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Car size={22} weight="bold" className="text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white font-heading">
              AutoCRM
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2" data-testid="sidebar-nav">
          <p className="px-4 py-2 text-xs font-semibold text-[#475569] uppercase tracking-wider">
            Меню
          </p>
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
        <div className="p-4 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#818CF8] rounded-xl flex items-center justify-center text-sm font-semibold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-[#64748B]">{roleLabels[user?.role] || user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#64748B] hover:text-[#EF4444] rounded-xl hover:bg-[#EF4444]/10 transition-all duration-200"
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
        <header className="h-16 bg-[#0A0B0F] border-b border-white/5 flex items-center justify-between px-6">
          {/* Search */}
          <div className="relative w-80">
            <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" />
            <input 
              type="text" 
              placeholder="Пошук..." 
              className="input-premium pl-11 py-2.5 w-full text-sm"
              data-testid="search-input"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="relative p-2.5 text-[#64748B] hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
              data-testid="notifications-btn"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-[#0A0B0F]"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 bg-[#0A0B0F]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
