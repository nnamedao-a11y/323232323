import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, useAuth } from '../App';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Gear, 
  Bell, 
  Shield, 
  Palette,
  Database,
  Globe,
  Key,
  User
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
      </Tabs>
    </motion.div>
  );
};

export default Settings;
