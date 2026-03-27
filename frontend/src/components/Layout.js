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
  FileText,
  Globe,
  Database,
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

  // Base nav items for all users
  const baseNavItems = [
    { path: '/', icon: House, label: 'Дашборд' },
    { path: '/leads', icon: Users, label: 'Ліди' },
    { path: '/customers', icon: UserCircle, label: 'Клієнти' },
    { path: '/deals', icon: Handshake, label: 'Угоди' },
    { path: '/deposits', icon: Wallet, label: 'Депозити' },
    { path: '/tasks', icon: CheckSquare, label: 'Завдання' },
    { path: '/documents', icon: FileText, label: 'Документи' },
    { path: '/staff', icon: UsersThree, label: 'Команда' },
    { path: '/settings', icon: Gear, label: 'Налаштування' },
  ];

  // Add parser control for master_admin and moderator
  const parserNavItem = { path: '/parser', icon: Database, label: 'Парсер' };
  const vehiclesNavItem = { path: '/vehicles', icon: Car, label: 'Авто' };
  const vinSearchNavItem = { path: '/vin', icon: MagnifyingGlass, label: 'VIN Пошук' };
  
  // Add extra items for master_admin only
  const navItems = user?.role === 'master_admin' 
    ? [...baseNavItems, vehiclesNavItem, vinSearchNavItem, parserNavItem]
    : user?.role === 'moderator'
    ? [...baseNavItems, vehiclesNavItem, vinSearchNavItem, parserNavItem]
    : baseNavItems;

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
      <aside className="sidebar">
        {/* Logo */}
        <div className="p-5 border-b border-[#E4E4E7]">
          <img 
            src="/images/logo.svg" 
            alt="Logo" 
            className="h-10 w-auto"
          />
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
        <div className="p-4 border-t border-[#E4E4E7]">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 bg-[#18181B] rounded-xl flex items-center justify-center text-sm font-semibold text-white">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#18181B] truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-[#71717A]">{roleLabels[user?.role] || user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#71717A] hover:text-[#DC2626] rounded-xl hover:bg-[#FEE2E2] transition-all"
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
        <header className="h-16 bg-white border-b border-[#E4E4E7] flex items-center justify-between px-8">
          {/* Search - без лупи */}
          <div className="w-80">
            <input 
              type="text" 
              placeholder="Пошук..." 
              className="input"
              data-testid="search-input"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="relative p-2.5 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-xl transition-all"
              data-testid="notifications-btn"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#DC2626] rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
