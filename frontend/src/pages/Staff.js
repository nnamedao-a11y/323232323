import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStaff(); fetchStats(); }, []);

  const fetchStaff = async () => {
    try { const res = await axios.get(`${API_URL}/api/staff`); setStaff(res.data.data || []); } catch (err) { toast.error('Помилка'); } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const res = await axios.get(`${API_URL}/api/staff/stats`); setStats(res.data || {}); } catch (err) {}
  };

  const roleLabels = { master_admin: 'Головний адмін', admin: 'Адміністратор', moderator: 'Модератор', manager: 'Менеджер', finance: 'Фінанси' };

  return (
    <motion.div data-testid="staff-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Команда</h1>
        <p className="text-sm text-[#71717A] mt-1">Управління персоналом</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8">
        {Object.entries(stats).map(([role, count]) => (
          <div key={role} className="kpi-card">
            <div className="kpi-value">{count}</div>
            <div className="kpi-label">{roleLabels[role] || role}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="table-premium" data-testid="staff-table">
          <thead><tr><th>Ім'я</th><th>Email</th><th>Роль</th><th>Статус</th><th>Останній вхід</th></tr></thead>
          <tbody>
            {loading ? (<tr><td colSpan={5} className="text-center py-12 text-[#71717A]">Завантаження...</td></tr>
            ) : staff.length === 0 ? (<tr><td colSpan={5} className="text-center py-12 text-[#71717A]">Немає даних</td></tr>
            ) : staff.map(user => (
              <tr key={user.id} data-testid={`staff-row-${user.id}`}>
                <td className="font-medium text-[#18181B]">{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td><span className="text-xs text-[#71717A]">{roleLabels[user.role]}</span></td>
                <td><span className={`badge ${user.isActive ? 'status-won' : 'status-lost'}`}>{user.isActive ? 'Активний' : 'Неактивний'}</span></td>
                <td className="text-sm text-[#71717A]">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('uk-UA') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default Staff;
