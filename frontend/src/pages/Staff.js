import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  UserCirclePlus,
  UserCircleMinus,
  Key,
  ChartBar,
  Phone,
  CheckCircle,
  Warning,
  Clock
} from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const ROLES = ['master_admin', 'admin', 'moderator', 'manager', 'finance'];

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [performance, setPerformance] = useState([]);
  const [inactiveManagers, setInactiveManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('day');
  const [activeTab, setActiveTab] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: 'manager', password: ''
  });

  useEffect(() => { 
    fetchStaff(); 
    fetchStats(); 
  }, []);

  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance();
      fetchInactive();
    }
  }, [activeTab, period]);

  const fetchStaff = async () => {
    try { 
      const res = await axios.get(`${API_URL}/api/staff`); 
      setStaff(res.data.data || []); 
    } catch (err) { 
      toast.error('Помилка завантаження'); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchStats = async () => {
    try { 
      const res = await axios.get(`${API_URL}/api/staff/stats`); 
      setStats(res.data || {}); 
    } catch (err) {}
  };

  const fetchPerformance = async () => {
    try { 
      const res = await axios.get(`${API_URL}/api/staff/performance?period=${period}`); 
      setPerformance(res.data || []); 
    } catch (err) { 
      console.error('Performance error:', err); 
    }
  };

  const fetchInactive = async () => {
    try { 
      const res = await axios.get(`${API_URL}/api/staff/inactive?hours=2`); 
      setInactiveManagers(res.data || []); 
    } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await axios.put(`${API_URL}/api/staff/${editingUser.id}`, updateData);
        toast.success('Користувача оновлено');
      } else {
        await axios.post(`${API_URL}/api/staff`, formData);
        toast.success('Користувача створено');
      }
      setShowModal(false);
      resetForm();
      fetchStaff();
      fetchStats();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Помилка'); 
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await axios.put(`${API_URL}/api/staff/${user.id}/toggle-active`);
      toast.success(user.isActive ? 'Користувача деактивовано' : 'Користувача активовано');
      fetchStaff();
    } catch (err) { 
      toast.error('Помилка'); 
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Введіть новий пароль:');
    if (!newPassword) return;
    try {
      await axios.post(`${API_URL}/api/staff/${userId}/reset-password`, { newPassword });
      toast.success('Пароль скинуто');
    } catch (err) { 
      toast.error('Помилка'); 
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      password: ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', role: 'manager', password: '' });
  };

  const roleLabels = { 
    master_admin: 'Головний адмін', 
    admin: 'Адміністратор', 
    moderator: 'Модератор', 
    manager: 'Менеджер', 
    finance: 'Фінанси' 
  };

  const periodLabels = { day: 'Сьогодні', week: 'Тиждень', month: 'Місяць' };

  return (
    <motion.div 
      data-testid="staff-page" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Команда
          </h1>
          <p className="text-sm text-[#71717A] mt-1">Управління персоналом та контроль продуктивності</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }} 
          className="btn-primary" 
          data-testid="create-user-btn"
        >
          <Plus size={18} weight="bold" />Новий співробітник
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
        {Object.entries(stats).map(([role, count]) => (
          <div key={role} className="kpi-card" data-testid={`staff-stat-${role}`}>
            <div className="kpi-value">{count}</div>
            <div className="kpi-label">{roleLabels[role] || role}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#F4F4F5] p-1 rounded-xl">
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#18181B] px-6 py-2 rounded-lg text-sm font-medium"
            data-testid="tab-list"
          >
            Список
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="data-[state=active]:bg-white data-[state=active]:text-[#18181B] px-6 py-2 rounded-lg text-sm font-medium"
            data-testid="tab-performance"
          >
            Продуктивність
          </TabsTrigger>
        </TabsList>

        {/* Staff List Tab */}
        <TabsContent value="list">
          <div className="card overflow-hidden">
            <table className="table-premium" data-testid="staff-table">
              <thead>
                <tr>
                  <th>Ім'я</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Останній вхід</th>
                  <th className="text-right">Дії</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-[#71717A]">Завантаження...</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-[#71717A]">Немає даних</td></tr>
                ) : staff.map(user => (
                  <tr key={user.id} data-testid={`staff-row-${user.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#18181B] rounded-xl flex items-center justify-center text-xs font-semibold text-white">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <span className="font-medium text-[#18181B]">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="text-[#3F3F46]">{user.email}</td>
                    <td className="text-[#71717A]">{user.phone || '—'}</td>
                    <td>
                      <span className="badge status-new">{roleLabels[user.role]}</span>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'status-won' : 'status-lost'}`}>
                        {user.isActive ? 'Активний' : 'Неактивний'}
                      </span>
                    </td>
                    <td className="text-sm text-[#71717A]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('uk-UA') : '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditModal(user)} 
                          className="p-2 hover:bg-[#F4F4F5] rounded-lg transition-colors" 
                          title="Редагувати"
                          data-testid={`edit-user-${user.id}`}
                        >
                          <Pencil size={16} className="text-[#71717A]" />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(user)} 
                          className={`p-2 rounded-lg transition-colors ${user.isActive ? 'hover:bg-[#FEE2E2]' : 'hover:bg-[#D1FAE5]'}`}
                          title={user.isActive ? 'Деактивувати' : 'Активувати'}
                          data-testid={`toggle-user-${user.id}`}
                        >
                          {user.isActive ? (
                            <UserCircleMinus size={16} className="text-[#DC2626]" />
                          ) : (
                            <UserCirclePlus size={16} className="text-[#059669]" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleResetPassword(user.id)} 
                          className="p-2 hover:bg-[#FEF3C7] rounded-lg transition-colors" 
                          title="Скинути пароль"
                          data-testid={`reset-pwd-${user.id}`}
                        >
                          <Key size={16} className="text-[#D97706]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          {/* Period Selector */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Продуктивність менеджерів
            </h2>
            <div className="period-tabs" data-testid="performance-period-selector">
              {['day', 'week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`period-tab ${period === p ? 'active' : ''}`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Inactive Managers Alert */}
          {inactiveManagers.length > 0 && (
            <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-xl p-4 mb-6 flex items-start gap-3" data-testid="inactive-alert">
              <Warning size={20} className="text-[#D97706] mt-0.5" />
              <div>
                <p className="font-medium text-[#92400E]">Неактивні менеджери</p>
                <p className="text-sm text-[#A16207]">
                  {inactiveManagers.map(m => m.userName || 'Unknown').join(', ')} — немає активності більше 2 годин
                </p>
              </div>
            </div>
          )}

          {/* Performance Table */}
          <div className="card overflow-hidden">
            <table className="table-premium" data-testid="performance-table">
              <thead>
                <tr>
                  <th>Менеджер</th>
                  <th className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ChartBar size={14} />
                      Дії
                    </div>
                  </th>
                  <th className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Phone size={14} />
                      Дзвінки
                    </div>
                  </th>
                  <th className="text-center">Ліди</th>
                  <th className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle size={14} />
                      Конверсія
                    </div>
                  </th>
                  <th className="text-center">Завдання</th>
                  <th className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={14} />
                      Остання дія
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-[#71717A]">Немає даних за обраний період</td></tr>
                ) : performance.map(manager => (
                  <tr key={manager.userId} data-testid={`performance-row-${manager.userId}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#4F46E5] rounded-xl flex items-center justify-center text-xs font-semibold text-white">
                          {manager.userName?.split(' ').map(n => n[0]).join('') || '??'}
                        </div>
                        <div>
                          <p className="font-medium text-[#18181B]">{manager.userName || 'Unknown'}</p>
                          <p className="text-xs text-[#71717A]">{roleLabels[manager.userRole] || manager.userRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold text-[#18181B]">{manager.totalActions}</span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-[#059669]">{manager.calls}</span>
                        {manager.callsMissed > 0 && (
                          <span className="text-xs text-[#DC2626]">(-{manager.callsMissed})</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-[#18181B]">{manager.leadsHandled}</span>
                        <span className="text-xs text-[#059669]">+{manager.leadsConverted}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${manager.conversionRate >= 30 ? 'status-won' : manager.conversionRate >= 15 ? 'status-contacted' : 'status-lost'}`}>
                        {manager.conversionRate}%
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-[#059669]">{manager.tasksCompleted}</span>
                        {manager.tasksOverdue > 0 && (
                          <span className="text-xs text-[#DC2626]">({manager.tasksOverdue} прострочено)</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center text-sm text-[#71717A]">
                      {manager.lastActivity ? new Date(manager.lastActivity).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl border border-[#E4E4E7]" data-testid="staff-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              {editingUser ? 'Редагувати співробітника' : 'Новий співробітник'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Ім'я</label>
                <input 
                  type="text" 
                  value={formData.firstName} 
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                  required 
                  className="input w-full" 
                  data-testid="staff-firstname-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Прізвище</label>
                <input 
                  type="text" 
                  value={formData.lastName} 
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                  required 
                  className="input w-full" 
                  data-testid="staff-lastname-input" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Email</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required 
                className="input w-full" 
                data-testid="staff-email-input" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Телефон</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  className="input w-full" 
                  data-testid="staff-phone-input" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Роль</label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger className="input" data-testid="staff-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">
                Пароль {editingUser && <span className="font-normal normal-case">(залиште пустим, щоб не змінювати)</span>}
              </label>
              <input 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required={!editingUser}
                className="input w-full" 
                data-testid="staff-password-input" 
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1" data-testid="staff-cancel-btn">
                Скасувати
              </button>
              <button type="submit" className="btn-primary flex-1" data-testid="staff-submit-btn">
                {editingUser ? 'Зберегти' : 'Створити'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Staff;
