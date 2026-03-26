import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { motion } from 'framer-motion';
import { 
  Users, 
  Warning,
  Wallet, 
  Clock,
  Phone,
  FileText,
  Gauge,
  Heartbeat,
  Lightning
} from '@phosphor-icons/react';

const Dashboard = () => {
  const [masterData, setMasterData] = useState(null);
  const [period, setPeriod] = useState('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMasterDashboard();
  }, [period]);

  const fetchMasterDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/dashboard/master?period=${period}`);
      setMasterData(response.data);
    } catch (err) {
      console.error('Master Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !masterData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#18181B] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const { sla, workload, leads, callbacks, deposits, documents, routing, system } = masterData;

  const periodLabels = {
    day: 'Сьогодні',
    week: 'Тиждень',
    month: 'Місяць',
  };

  return (
    <motion.div 
      data-testid="master-dashboard-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Control Dashboard
          </h1>
          <p className="text-sm text-[#71717A] mt-1">
            Оновлено: {new Date(masterData.generatedAt).toLocaleString('uk-UA')}
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="period-tabs" data-testid="period-selector">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`period-tab ${period === p ? 'active' : ''}`}
              data-testid={`period-${p}`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8" data-testid="kpi-summary-row">
        <KpiCard 
          icon={Users} 
          label="Нові ліди" 
          value={leads.newCount} 
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <KpiCard 
          icon={Warning} 
          label="Прострочені" 
          value={sla.overdueLeads} 
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          alert={sla.overdueLeads > 0}
        />
        <KpiCard 
          icon={Wallet} 
          label="Pending депозити" 
          value={deposits.pendingDeposits} 
          iconBg="#EDE9FE"
          iconColor="#7C3AED"
        />
        <KpiCard 
          icon={FileText} 
          label="На верифікацію" 
          value={documents.pendingVerification} 
          iconBg="#FEF3C7"
          iconColor="#D97706"
          alert={documents.pendingVerification > 5}
        />
        <KpiCard 
          icon={Users} 
          label="Перевантажені" 
          value={workload.overloadedManagers} 
          iconBg={workload.overloadedManagers > 0 ? "#FEE2E2" : "#D1FAE5"}
          iconColor={workload.overloadedManagers > 0 ? "#DC2626" : "#059669"}
          alert={workload.overloadedManagers > 0}
        />
        <KpiCard 
          icon={Lightning} 
          label="Failed Jobs" 
          value={system.failedJobs} 
          iconBg={system.failedJobs > 0 ? "#FEE2E2" : "#D1FAE5"}
          iconColor={system.failedJobs > 0 ? "#DC2626" : "#059669"}
        />
      </div>

      {/* Main Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* SLA Control */}
        <div className="section-card" data-testid="sla-control">
          <div className="section-title">
            <div className="section-icon" style={{ background: '#FEE2E2' }}>
              <Clock size={18} weight="bold" style={{ color: '#DC2626' }} />
            </div>
            SLA Control
          </div>
          <div>
            <MetricRow label="Прострочені ліди" value={sla.overdueLeads} alert={sla.overdueLeads > 0} />
            <MetricRow label="Прострочені задачі" value={sla.overdueTasks} alert={sla.overdueTasks > 0} />
            <MetricRow label="Прострочені callback" value={sla.overdueCallbacks} alert={sla.overdueCallbacks > 0} />
            <MetricRow label="Avg First Response" value={`${sla.avgFirstResponseMinutes} хв`} alert={sla.avgFirstResponseMinutes > 30} />
            <MetricRow label="Missed SLA Rate" value={`${sla.missedSlaRate}%`} alert={sla.missedSlaRate > 15} />
          </div>
        </div>

        {/* Lead Flow */}
        <div className="section-card" data-testid="lead-flow">
          <div className="section-title">
            <div className="section-icon" style={{ background: '#EEF2FF' }}>
              <Users size={18} weight="bold" style={{ color: '#4F46E5' }} />
            </div>
            Lead Flow
          </div>
          <div>
            <MetricRow label="Нові" value={leads.newCount} color="#4F46E5" />
            <MetricRow label="В роботі" value={leads.inProgressCount} color="#D97706" />
            <MetricRow label="Конвертовані" value={leads.convertedCount} color="#059669" />
            <MetricRow label="Втрачені" value={leads.lostCount} color="#DC2626" />
            <MetricRow label="Без менеджера" value={leads.unassignedCount} alert={leads.unassignedCount > 0} />
          </div>
        </div>

        {/* Callback Control */}
        <div className="section-card" data-testid="callback-control">
          <div className="section-title">
            <div className="section-icon" style={{ background: '#EDE9FE' }}>
              <Phone size={18} weight="bold" style={{ color: '#7C3AED' }} />
            </div>
            Callback Control
          </div>
          <div>
            <MetricRow label="Missed Calls" value={callbacks.missedCalls} alert={callbacks.missedCalls > 0} />
            <MetricRow label="No Answer" value={callbacks.noAnswerLeads} alert={callbacks.noAnswerLeads > 3} />
            <MetricRow label="Follow-ups due" value={callbacks.followUpsDue} alert={callbacks.followUpsDue > 0} />
            <MetricRow label="Callback заплановано" value={callbacks.callbacksScheduled} />
            <MetricRow label="SMS відправлено" value={callbacks.smsTriggered} color="#4F46E5" />
          </div>
        </div>
      </div>

      {/* Main Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Workload Heatmap */}
        <div className="section-card" data-testid="workload-heatmap">
          <div className="section-title">
            <div className="section-icon" style={{ background: '#FEF3C7' }}>
              <Gauge size={18} weight="bold" style={{ color: '#D97706' }} />
            </div>
            Workload
            <span className="text-[#71717A] font-normal text-sm ml-1">({workload.totalManagers})</span>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {workload.managers.map((manager) => (
              <div 
                key={manager.managerId}
                className={`flex items-center justify-between p-3 rounded-xl ${getWorkloadBg(manager.status)}`}
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={manager.status} />
                  <span className="text-sm font-medium text-[#18181B] truncate max-w-[100px]">{manager.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#71717A]">
                  <span>{manager.activeLeads} лідів</span>
                  <span>{manager.openTasks} задач</span>
                  <span className="font-semibold text-[#18181B] bg-white px-2 py-1 rounded-lg">
                    {manager.score}
                  </span>
                </div>
              </div>
            ))}
            {workload.managers.length === 0 && (
              <p className="text-sm text-[#71717A] text-center py-4">Немає активних менеджерів</p>
            )}
          </div>
        </div>

        {/* Deposits & Documents */}
        <div className="section-card" data-testid="deposits-docs">
          <div className="section-title">
            <div className="section-icon" style={{ background: '#D1FAE5' }}>
              <Wallet size={18} weight="bold" style={{ color: '#059669' }} />
            </div>
            Депозити & Документи
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">Депозити</p>
              <div className="space-y-1">
                <MetricRow label="Pending" value={deposits.pendingDeposits} />
                <MetricRow label="Без proof" value={deposits.depositsWithoutProof} alert={deposits.depositsWithoutProof > 0} />
                <MetricRow label="Верифіковано" value={deposits.verifiedToday} color="#059669" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">Документи</p>
              <div className="space-y-1">
                <MetricRow label="На верифікацію" value={documents.pendingVerification} alert={documents.pendingVerification > 3} />
                <MetricRow label="Відхилено" value={documents.rejectedCount} color="#DC2626" />
                <MetricRow label="Завантажено" value={documents.uploadedToday} color="#4F46E5" />
              </div>
            </div>
          </div>
        </div>

        {/* Routing & System Health */}
        <div className="section-card" data-testid="routing-health">
          <div className="section-title">
            <div className="section-icon" style={{ background: '#D1FAE5' }}>
              <Heartbeat size={18} weight="bold" style={{ color: '#059669' }} />
            </div>
            Routing & System
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">Routing</p>
              <div className="space-y-1">
                <MetricRow label="Fallback" value={routing.fallbackAssignments} alert={routing.fallbackAssignments > 5} />
                <MetricRow label="Reassign Rate" value={`${routing.reassignmentRate}%`} />
                <MetricRow label="Без менеджера" value={routing.unassignedLeads} alert={routing.unassignedLeads > 0} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-3">System</p>
              <div className="space-y-1">
                <div className="metric-row">
                  <span className="metric-label">Status</span>
                  <SystemStatusBadge status={system.systemStatus} />
                </div>
                <MetricRow label="Queue" value={system.queueBacklog} />
                <MetricRow label="Помилки" value={system.failedJobs} alert={system.failedJobs > 0} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper Components
const KpiCard = ({ icon: Icon, label, value, iconBg, iconColor, alert }) => (
  <div className={`kpi-card ${alert ? 'border-[#DC2626]' : ''}`} data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        <Icon size={20} weight="bold" style={{ color: iconColor }} />
      </div>
    </div>
    <div className={`kpi-value ${alert ? 'text-[#DC2626]' : ''}`}>{value}</div>
    <div className="kpi-label">{label}</div>
  </div>
);

const MetricRow = ({ label, value, color, alert }) => (
  <div className="metric-row">
    <span className="metric-label">{label}</span>
    <span className={`metric-value ${alert ? 'alert' : ''}`} style={{ color: !alert && color ? color : undefined }}>
      {value}
    </span>
  </div>
);

const StatusDot = ({ status }) => {
  const colors = {
    ok: '#059669',
    busy: '#D97706',
    overloaded: '#DC2626',
    idle: '#71717A',
  };
  return (
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: colors[status] || '#71717A' }} />
  );
};

const getWorkloadBg = (status) => {
  const bgs = {
    ok: 'bg-[#D1FAE5]',
    busy: 'bg-[#FEF3C7]',
    overloaded: 'bg-[#FEE2E2]',
    idle: 'bg-[#F4F4F5]',
  };
  return bgs[status] || 'bg-[#F4F4F5]';
};

const SystemStatusBadge = ({ status }) => {
  const configs = {
    healthy: { bg: '#D1FAE5', color: '#059669', label: 'Healthy' },
    warning: { bg: '#FEF3C7', color: '#D97706', label: 'Warning' },
    critical: { bg: '#FEE2E2', color: '#DC2626', label: 'Critical' },
  };
  const config = configs[status] || configs.healthy;
  return (
    <span className="badge" style={{ background: config.bg, color: config.color }}>
      {config.label}
    </span>
  );
};

export default Dashboard;
