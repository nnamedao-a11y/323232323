import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, useAuth } from '../App';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gear, 
  Bell, 
  Shield, 
  Palette,
  Database,
  Globe,
  Key,
  User,
  Plus,
  Trash,
  Check,
  X,
  ArrowsClockwise,
  Lightning,
  ShieldCheck,
  Warning,
  Plugs,
  Eye,
  EyeSlash
} from '@phosphor-icons/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';

const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Proxy state
  const [proxies, setProxies] = useState([]);
  const [proxyStatus, setProxyStatus] = useState(null);
  const [proxyLoading, setProxyLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [newProxy, setNewProxy] = useState({
    host: '',
    port: '',
    protocol: 'http',
    username: '',
    password: '',
    priority: 1
  });
  
  const isMasterAdmin = user?.role === 'master_admin';

  useEffect(() => { 
    fetchSettings(); 
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'proxy' && isMasterAdmin) {
      fetchProxyStatus();
    }
  }, [activeTab, isMasterAdmin]);

  const fetchSettings = async () => {
    try { 
      const res = await axios.get(`${API_URL}/api/settings`); 
      setSettings(res.data || []); 
    } catch (err) { 
      toast.error('Помилка завантаження налаштувань'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/api/users/me`, profileData);
      toast.success('Профіль оновлено');
    } catch (err) {
      toast.error('Помилка оновлення профілю');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Пароль змінено');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка зміни паролю');
    }
  };

  // Proxy functions
  const fetchProxyStatus = async () => {
    setProxyLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/proxy/status`);
      setProxyStatus(res.data);
      setProxies(res.data.proxies || []);
    } catch (err) {
      console.error('Proxy fetch error:', err);
    } finally {
      setProxyLoading(false);
    }
  };

  const handleAddProxy = async (e) => {
    e.preventDefault();
    if (!newProxy.host || !newProxy.port) {
      toast.error('IP адреса та порт обов\'язкові');
      return;
    }
    try {
      await axios.post(`${API_URL}/api/admin/proxy/add`, {
        host: newProxy.host,
        port: parseInt(newProxy.port),
        protocol: newProxy.protocol,
        username: newProxy.username || undefined,
        password: newProxy.password || undefined,
        priority: parseInt(newProxy.priority) || 1
      });
      toast.success('Проксі додано');
      setNewProxy({ host: '', port: '', protocol: 'http', username: '', password: '', priority: 1 });
      setShowAddForm(false);
      fetchProxyStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка додавання проксі');
    }
  };

  const handleRemoveProxy = async (id) => {
    if (!window.confirm('Видалити цей проксі?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/proxy/remove/${id}`);
      toast.success('Проксі видалено');
      fetchProxyStatus();
    } catch (err) {
      toast.error('Помилка видалення');
    }
  };

  const handleToggleProxy = async (id, enabled) => {
    try {
      if (enabled) {
        await axios.post(`${API_URL}/api/admin/proxy/disable/${id}`);
      } else {
        await axios.post(`${API_URL}/api/admin/proxy/enable/${id}`);
      }
      toast.success(enabled ? 'Проксі вимкнено' : 'Проксі увімкнено');
      fetchProxyStatus();
    } catch (err) {
      toast.error('Помилка зміни статусу');
    }
  };

  const handleTestProxy = async (id) => {
    setTestingId(id);
    try {
      const res = await axios.post(`${API_URL}/api/admin/proxy/test/${id}`);
      if (res.data.success) {
        toast.success(`Проксі працює! IP: ${res.data.ip || 'ok'}`);
      } else {
        toast.error(`Помилка: ${res.data.error || 'невідома'}`);
      }
      fetchProxyStatus();
    } catch (err) {
      toast.error('Помилка тестування');
    } finally {
      setTestingId(null);
    }
  };

  const handleSetPriority = async (id, priority) => {
    try {
      await axios.post(`${API_URL}/api/admin/proxy/priority/${id}`, { priority });
      toast.success('Пріоритет оновлено');
      fetchProxyStatus();
    } catch (err) {
      toast.error('Помилка');
    }
  };

  const handleReloadProxies = async () => {
    try {
      await axios.post(`${API_URL}/api/admin/proxy/reload`);
      toast.success('Проксі перезавантажено');
      fetchProxyStatus();
    } catch (err) {
      toast.error('Помилка');
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const parseServer = (server) => {
    try {
      const url = new URL(server);
      return { protocol: url.protocol.replace(':', ''), host: url.hostname, port: url.port };
    } catch {
      return { protocol: 'http', host: server, port: '' };
    }
  };

  const settingLabels = {
    lead_statuses: 'Статуси лідів',
    deal_statuses: 'Статуси угод',
    deposit_statuses: 'Статуси депозитів',
    lead_sources: 'Джерела лідів',
    sla_first_response_minutes: 'SLA: перша відповідь (хв)',
    sla_callback_minutes: 'SLA: callback (хв)'
  };

  const settingIcons = {
    lead_statuses: <Database size={18} />,
    deal_statuses: <Database size={18} />,
    deposit_statuses: <Database size={18} />,
    lead_sources: <Globe size={18} />
  };

  const roleLabels = {
    master_admin: 'Головний адмін',
    admin: 'Адміністратор',
    moderator: 'Модератор',
    manager: 'Менеджер',
    finance: 'Фінанси'
  };

  return (
    <motion.div 
      data-testid="settings-page" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
          Налаштування
        </h1>
        <p className="text-sm text-[#71717A] mt-1">Конфігурація системи та профілю</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#F4F4F5] p-1 rounded-xl inline-flex">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#18181B] px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Gear size={16} />
            Загальні
          </TabsTrigger>
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#18181B] px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <User size={16} />
            Профіль
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#18181B] px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Shield size={16} />
            Безпека
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#18181B] px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <Bell size={16} />
            Сповіщення
          </TabsTrigger>
          {isMasterAdmin && (
            <TabsTrigger 
              value="proxy" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#18181B] px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <Globe size={16} />
              Проксі
            </TabsTrigger>
          )}
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          {loading ? (
            <div className="text-center py-12 text-[#71717A]">Завантаження...</div>
          ) : (
            <div className="space-y-5">
              {settings.map(setting => (
                <div key={setting.id || setting.key} className="section-card" data-testid={`setting-${setting.key}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
                      {settingIcons[setting.key] || <Gear size={18} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                        {settingLabels[setting.key] || setting.key}
                      </h3>
                      <p className="text-xs text-[#71717A]">{setting.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(setting.value) ? setting.value.map((val, i) => (
                      <span 
                        key={i} 
                        className="px-3 py-1.5 bg-[#F4F4F5] text-sm rounded-lg text-[#3F3F46] font-medium"
                      >
                        {val}
                      </span>
                    )) : (
                      <span className="text-sm text-[#3F3F46] font-medium">{JSON.stringify(setting.value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="section-card">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[#18181B] rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-4">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <h3 className="font-semibold text-[#18181B] text-lg" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-[#71717A]">{user?.email}</p>
                <span className="badge status-new mt-3">{roleLabels[user?.role] || user?.role}</span>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div className="section-card lg:col-span-2">
              <h3 className="font-semibold text-[#18181B] mb-6" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                Редагувати профіль
              </h3>
              <form onSubmit={handleProfileUpdate} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Ім'я</label>
                    <input 
                      type="text" 
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      className="input w-full" 
                      data-testid="profile-firstname"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Прізвище</label>
                    <input 
                      type="text" 
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      className="input w-full" 
                      data-testid="profile-lastname"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Email</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="input w-full" 
                    disabled
                    data-testid="profile-email"
                  />
                  <p className="text-xs text-[#71717A] mt-1">Email не можна змінити</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Телефон</label>
                  <input 
                    type="tel" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="input w-full" 
                    data-testid="profile-phone"
                  />
                </div>
                <button type="submit" className="btn-primary" data-testid="save-profile-btn">
                  Зберегти зміни
                </button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Change Password */}
            <div className="section-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]">
                  <Key size={18} />
                </div>
                <h3 className="font-semibold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  Змінити пароль
                </h3>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Поточний пароль</label>
                  <input 
                    type="password" 
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                    className="input w-full" 
                    data-testid="current-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Новий пароль</label>
                  <input 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    className="input w-full" 
                    data-testid="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Підтвердити пароль</label>
                  <input 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    className="input w-full" 
                    data-testid="confirm-password"
                  />
                </div>
                <button type="submit" className="btn-primary" data-testid="change-password-btn">
                  Змінити пароль
                </button>
              </form>
            </div>

            {/* Security Info */}
            <div className="section-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] flex items-center justify-center text-[#059669]">
                  <Shield size={18} />
                </div>
                <h3 className="font-semibold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                  Інформація про безпеку
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F4F4F5] rounded-xl">
                  <div>
                    <p className="font-medium text-[#18181B]">Двофакторна автентифікація</p>
                    <p className="text-xs text-[#71717A]">Додатковий рівень захисту</p>
                  </div>
                  <span className="badge status-contacted">Скоро</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F4F4F5] rounded-xl">
                  <div>
                    <p className="font-medium text-[#18181B]">Останній вхід</p>
                    <p className="text-xs text-[#71717A]">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('uk-UA') : 'Невідомо'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <div className="section-card max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED]">
                <Bell size={18} />
              </div>
              <h3 className="font-semibold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                Налаштування сповіщень
              </h3>
            </div>
            <div className="space-y-4">
              {[
                { key: 'new_lead', label: 'Новий лід', desc: 'Сповіщення при надходженні нового ліда' },
                { key: 'task_due', label: 'Завдання', desc: 'Нагадування про дедлайни завдань' },
                { key: 'callback', label: 'Callback', desc: 'Нагадування про заплановані дзвінки' },
                { key: 'deal_update', label: 'Угоди', desc: 'Оновлення статусу угод' },
                { key: 'deposit', label: 'Депозити', desc: 'Нові та підтверджені депозити' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-[#F4F4F5] rounded-xl">
                  <div>
                    <p className="font-medium text-[#18181B]">{item.label}</p>
                    <p className="text-xs text-[#71717A]">{item.desc}</p>
                  </div>
                  <Switch defaultChecked data-testid={`notification-${item.key}`} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Proxy Settings - Master Admin Only */}
        {isMasterAdmin && (
          <TabsContent value="proxy">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
                  <Globe size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                    Управління проксі
                  </h3>
                  <p className="text-xs text-[#71717A]">Проксі-сервери для парсерів</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReloadProxies}
                  className="px-4 py-2 text-sm font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ArrowsClockwise size={16} />
                  Перезавантажити
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0A0A0B] hover:bg-[#18181B] rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  Додати проксі
                </button>
              </div>
            </div>

            {/* Status Cards */}
            {proxyStatus && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-5 border border-[#E4E4E7]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F0FDF4] flex items-center justify-center">
                      <Globe size={20} className="text-[#16A34A]" />
                    </div>
                    <span className="text-sm font-medium text-[#71717A]">Всього</span>
                  </div>
                  <p className="text-2xl font-bold text-[#18181B]">{proxyStatus.total}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-[#E4E4E7]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                      <Check size={20} className="text-[#059669]" />
                    </div>
                    <span className="text-sm font-medium text-[#71717A]">Активних</span>
                  </div>
                  <p className="text-2xl font-bold text-[#059669]">{proxyStatus.active}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-[#E4E4E7]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                      <Warning size={20} className="text-[#D97706]" />
                    </div>
                    <span className="text-sm font-medium text-[#71717A]">Cooldown</span>
                  </div>
                  <p className="text-2xl font-bold text-[#D97706]">{proxyStatus.onCooldown}</p>
                </div>
                <div className="bg-white rounded-xl p-5 border border-[#E4E4E7]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F4F4F5] flex items-center justify-center">
                      <Plugs size={20} className="text-[#71717A]" />
                    </div>
                    <span className="text-sm font-medium text-[#71717A]">Вимкнено</span>
                  </div>
                  <p className="text-2xl font-bold text-[#71717A]">{proxyStatus.disabled}</p>
                </div>
              </div>
            )}

            {/* Proxies Table */}
            <div className="bg-white rounded-xl border border-[#E4E4E7] overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7]">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#71717A] uppercase">ID</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#71717A] uppercase">Сервер</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#71717A] uppercase">Авторизація</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#71717A] uppercase">Пріоритет</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#71717A] uppercase">Статистика</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-[#71717A] uppercase">Статус</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-[#71717A] uppercase">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7]">
                  {proxyLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-[#0A0A0B] border-t-transparent rounded-full mx-auto"></div>
                      </td>
                    </tr>
                  ) : proxies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#71717A]">
                        Проксі не налаштовано
                      </td>
                    </tr>
                  ) : (
                    proxies.map((proxy) => {
                      const serverInfo = parseServer(proxy.server);
                      const isOnCooldown = proxy.cooldown_until && proxy.cooldown_until > Date.now();
                      
                      return (
                        <tr key={proxy.id} className="hover:bg-[#FAFAFA] transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono text-[#18181B]">#{proxy.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-[#18181B]">{serverInfo.host}</span>
                              <span className="text-xs text-[#71717A]">{serverInfo.protocol.toUpperCase()}:{serverInfo.port}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {proxy.username ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-[#18181B]">{proxy.username}</span>
                                <button onClick={() => togglePasswordVisibility(proxy.id)} className="text-[#71717A] hover:text-[#18181B]">
                                  {showPasswords[proxy.id] ? <EyeSlash size={14} /> : <Eye size={14} />}
                                </button>
                                {showPasswords[proxy.id] && proxy.password && (
                                  <span className="text-xs text-[#71717A]">/ {proxy.password}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-[#71717A]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={proxy.priority}
                              onChange={e => handleSetPriority(proxy.id, parseInt(e.target.value))}
                              className="text-sm bg-[#F4F4F5] px-2 py-1 rounded border-0 focus:ring-1 focus:ring-[#0A0A0B]"
                            >
                              {[1,2,3,4,5,6,7,8,9,10].map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs px-2 py-1 bg-[#ECFDF5] text-[#059669] rounded-full">{proxy.success_count} ok</span>
                              <span className="text-xs px-2 py-1 bg-[#FEF2F2] text-[#DC2626] rounded-full">{proxy.error_count} err</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {!proxy.enabled ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#F4F4F5] text-[#71717A]">
                                <X size={12} />
                                Вимкнено
                              </span>
                            ) : isOnCooldown ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706]">
                                <Warning size={12} />
                                Cooldown
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669]">
                                <Check size={12} />
                                Активний
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleTestProxy(proxy.id)}
                                disabled={testingId === proxy.id}
                                className="p-2 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-lg transition-colors disabled:opacity-50"
                                title="Тестувати"
                              >
                                {testingId === proxy.id ? <ArrowsClockwise size={16} className="animate-spin" /> : <Lightning size={16} />}
                              </button>
                              <button
                                onClick={() => handleToggleProxy(proxy.id, proxy.enabled)}
                                className="p-2 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-lg transition-colors"
                                title={proxy.enabled ? 'Вимкнути' : 'Увімкнути'}
                              >
                                {proxy.enabled ? <X size={16} /> : <Check size={16} />}
                              </button>
                              <button
                                onClick={() => handleRemoveProxy(proxy.id)}
                                className="p-2 text-[#71717A] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                                title="Видалити"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Info Block */}
            <div className="mt-6 bg-[#F0F9FF] rounded-xl p-5 border border-[#BAE6FD]">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} className="text-[#0EA5E9]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0C4A6E] mb-1">Як працюють проксі</h3>
                  <p className="text-sm text-[#0369A1]">
                    Проксі використовуються для парсингу даних з Copart, IAAI та інших джерел. 
                    Система автоматично перемикається між проксі при помилках.
                  </p>
                </div>
              </div>
            </div>

            {/* Add Proxy Modal */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                  onClick={() => setShowAddForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                    onClick={e => e.stopPropagation()}
                  >
                    <h2 className="text-lg font-semibold text-[#18181B] mb-6">Додати новий проксі</h2>
                    <form onSubmit={handleAddProxy} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#18181B] mb-2">Протокол</label>
                        <select
                          value={newProxy.protocol}
                          onChange={e => setNewProxy({ ...newProxy, protocol: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#F4F4F5] border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#0A0A0B] outline-none"
                        >
                          <option value="http">HTTP</option>
                          <option value="https">HTTPS</option>
                          <option value="socks5">SOCKS5</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#18181B] mb-2">IP адреса *</label>
                        <input
                          type="text"
                          value={newProxy.host}
                          onChange={e => setNewProxy({ ...newProxy, host: e.target.value })}
                          placeholder="192.168.1.1"
                          className="w-full px-4 py-2.5 bg-[#F4F4F5] border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#0A0A0B] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#18181B] mb-2">Порт *</label>
                        <input
                          type="number"
                          value={newProxy.port}
                          onChange={e => setNewProxy({ ...newProxy, port: e.target.value })}
                          placeholder="8080"
                          className="w-full px-4 py-2.5 bg-[#F4F4F5] border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#0A0A0B] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#18181B] mb-2">Логін</label>
                        <input
                          type="text"
                          value={newProxy.username}
                          onChange={e => setNewProxy({ ...newProxy, username: e.target.value })}
                          placeholder="username"
                          className="w-full px-4 py-2.5 bg-[#F4F4F5] border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#0A0A0B] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#18181B] mb-2">Пароль</label>
                        <input
                          type="password"
                          value={newProxy.password}
                          onChange={e => setNewProxy({ ...newProxy, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full px-4 py-2.5 bg-[#F4F4F5] border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#0A0A0B] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#18181B] mb-2">Пріоритет (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={newProxy.priority}
                          onChange={e => setNewProxy({ ...newProxy, priority: e.target.value })}
                          className="w-full px-4 py-2.5 bg-[#F4F4F5] border-0 rounded-lg text-sm focus:ring-2 focus:ring-[#0A0A0B] outline-none"
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 px-4 py-2.5 text-sm font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-lg"
                        >
                          Скасувати
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#0A0A0B] hover:bg-[#18181B] rounded-lg"
                        >
                          Додати
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
};

export default Settings;
