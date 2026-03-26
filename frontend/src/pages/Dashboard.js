import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { 
  Users, 
  UserCircle, 
  Handshake, 
  Wallet, 
  CheckSquare, 
  TrendUp, 
  TrendDown,
  Clock,
  Warning
} from '@phosphor-icons/react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, kpiRes] = await Promise.all([
        axios.get(`${API_URL}/api/dashboard`),
        axios.get(`${API_URL}/api/dashboard/kpi`)
      ]);
      setStats(dashboardRes.data);
      setKpi(kpiRes.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#0A0A0B] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const kpiCards = [
    { 
      label: 'Всього лідів', 
      value: kpi?.totalLeads || 0, 
      icon: Users, 
      color: '#0055FF',
      bgColor: '#DBEAFE'
    },
    { 
      label: 'Всього угод', 
      value: kpi?.totalDeals || 0, 
      icon: Handshake, 
      color: '#16A34A',
      bgColor: '#D1FAE5'
    },
    { 
      label: 'Сума угод', 
      value: `$${(kpi?.totalDealsValue || 0).toLocaleString()}`, 
      icon: TrendUp, 
      color: '#0A0A0B',
      bgColor: '#F4F4F5'
    },
    { 
      label: 'Депозити', 
      value: `$${(kpi?.totalDepositsAmount || 0).toLocaleString()}`, 
      icon: Wallet, 
      color: '#7C3AED',
      bgColor: '#EDE9FE'
    },
    { 
      label: 'Конверсія', 
      value: `${kpi?.conversionRate || 0}%`, 
      icon: TrendUp, 
      color: '#16A34A',
      bgColor: '#D1FAE5'
    },
  ];

  return (
    <div data-testid="dashboard-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
          Дашборд
        </h1>
        <p className="text-sm text-[#71717A] mt-1">Огляд ключових показників</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6" data-testid="kpi-grid">
        {kpiCards.map((card, index) => (
          <div key={index} className="kpi-card" data-testid={`kpi-${card.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-10 h-10 flex items-center justify-center"
                style={{ backgroundColor: card.bgColor }}
              >
                <card.icon size={20} weight="bold" style={{ color: card.color }} />
              </div>
            </div>
            <div className="kpi-value">{card.value}</div>
            <div className="kpi-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads by Status */}
        <div className="bg-white border border-[#D4D4D8] p-5" data-testid="leads-by-status">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Ліди за статусом
          </h3>
          <div className="space-y-3">
            {Object.entries(stats?.leads?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`status-badge status-${status}`}>{status}</span>
                <span className="text-sm font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(stats?.leads?.byStatus || {}).length === 0 && (
              <p className="text-sm text-[#71717A]">Немає даних</p>
            )}
          </div>
        </div>

        {/* Deals by Status */}
        <div className="bg-white border border-[#D4D4D8] p-5" data-testid="deals-by-status">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Угоди за статусом
          </h3>
          <div className="space-y-3">
            {Object.entries(stats?.deals?.byStatus || {}).map(([status, data]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status.replace(/_/g, ' ')}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold">{data.count}</span>
                  <span className="text-xs text-[#71717A] ml-2">${data.value?.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {Object.keys(stats?.deals?.byStatus || {}).length === 0 && (
              <p className="text-sm text-[#71717A]">Немає даних</p>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white border border-[#D4D4D8] p-5" data-testid="tasks-summary">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Мої завдання
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#F4F4F5]">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare size={18} className="text-[#71717A]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">Всього</span>
              </div>
              <div className="text-2xl font-bold">{stats?.tasks?.total || 0}</div>
            </div>
            <div className="p-3 bg-[#FEE2E2]">
              <div className="flex items-center gap-2 mb-2">
                <Warning size={18} className="text-[#DC2626]" />
                <span className="text-xs font-semibold uppercase tracking-wide text-[#DC2626]">Прострочено</span>
              </div>
              <div className="text-2xl font-bold text-[#DC2626]">{stats?.tasks?.overdue || 0}</div>
            </div>
          </div>
        </div>

        {/* Deposits */}
        <div className="bg-white border border-[#D4D4D8] p-5" data-testid="deposits-summary">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Депозити
          </h3>
          <div className="space-y-3">
            {Object.entries(stats?.deposits?.byStatus || {}).map(([status, data]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold">{data.count}</span>
                  <span className="text-xs text-[#71717A] ml-2">${data.amount?.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {Object.keys(stats?.deposits?.byStatus || {}).length === 0 && (
              <p className="text-sm text-[#71717A]">Немає даних</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
