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
  Warning,
  Phone,
  ChatText,
  ArrowsClockwise,
  Lightning,
  FileText,
  Gauge,
  ShieldCheck,
  Heartbeat,
  CaretDown
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
        <div className="animate-spin w-8 h-8 border-2 border-[#0A0A0B] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const { sla, workload, leads, callbacks, deposits, documents, routing, system } = masterData;

  // Calculate critical alerts
  const criticalAlerts = [
    sla.overdueLeads > 5 && `${sla.overdueLeads} прострочених лідів`,
    sla.overdueTasks > 5 && `${sla.overdueTasks} прострочених задач`,
    workload.overloadedManagers > 0 && `${workload.overloadedManagers} перевантажених менеджерів`,
    deposits.depositsWithoutProof > 3 && `${deposits.depositsWithoutProof} депозитів без підтвердження`,
    documents.pendingVerification > 5 && `${documents.pendingVerification} документів на верифікацію`,
    system.systemStatus === 'critical' && 'Критична системна помилка',
  ].filter(Boolean);

  const periodLabels = {
    day: 'За сьогодні',
    week: 'За тиждень',
    month: 'За місяць',
  };

  return (
    <div data-testid="master-dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Control Dashboard
          </h1>
          <p className="text-sm text-[#71717A] mt-1">
            Оновлено: {new Date(masterData.generatedAt).toLocaleString('uk-UA')}
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-2" data-testid="period-selector">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                period === p
                  ? 'bg-[#0A0A0B] text-white'
                  : 'bg-white border border-[#D4D4D8] hover:bg-[#F4F4F5]'
              }`}
              data-testid={`period-${p}`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-[#FEE2E2] border border-[#DC2626] p-4 mb-6" data-testid="critical-alerts">
          <div className="flex items-center gap-2 mb-2">
            <Warning size={20} weight="fill" className="text-[#DC2626]" />
            <span className="text-sm font-bold text-[#DC2626] uppercase tracking-wide">
              Критичні сповіщення ({criticalAlerts.length})
            </span>
          </div>
          <ul className="space-y-1">
            {criticalAlerts.map((alert, i) => (
              <li key={i} className="text-sm text-[#991B1B]">• {alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6" data-testid="kpi-summary-row">
        <KpiCard 
          icon={Users} 
          label="Нові ліди" 
          value={leads.newCount} 
          color="#0055FF" 
          bgColor="#DBEAFE"
        />
        <KpiCard 
          icon={Warning} 
          label="Прострочені" 
          value={sla.overdueLeads} 
          color="#DC2626" 
          bgColor="#FEE2E2"
          alert={sla.overdueLeads > 5}
        />
        <KpiCard 
          icon={Wallet} 
          label="Pending депозити" 
          value={deposits.pendingDeposits} 
          color="#7C3AED" 
          bgColor="#EDE9FE"
        />
        <KpiCard 
          icon={FileText} 
          label="На верифікацію" 
          value={documents.pendingVerification} 
          color="#F59E0B" 
          bgColor="#FEF3C7"
          alert={documents.pendingVerification > 5}
        />
        <KpiCard 
          icon={UserCircle} 
          label="Перевантажені" 
          value={workload.overloadedManagers} 
          color="#DC2626" 
          bgColor="#FEE2E2"
          alert={workload.overloadedManagers > 0}
        />
        <KpiCard 
          icon={Lightning} 
          label="Failed Jobs" 
          value={system.failedJobs} 
          color={system.failedJobs > 0 ? '#DC2626' : '#16A34A'} 
          bgColor={system.failedJobs > 0 ? '#FEE2E2' : '#D1FAE5'}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SLA Control */}
        <div className="bg-white border border-[#D4D4D8] p-5 h-full" data-testid="sla-control">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} weight="bold" className="text-[#DC2626]" />
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              SLA Control
            </h3>
          </div>
          <div className="space-y-3">
            <MetricRow 
              label="Прострочені ліди" 
              value={sla.overdueLeads} 
              alert={sla.overdueLeads > 0}
            />
            <MetricRow 
              label="Прострочені задачі" 
              value={sla.overdueTasks} 
              alert={sla.overdueTasks > 0}
            />
            <MetricRow 
              label="Прострочені callback" 
              value={sla.overdueCallbacks} 
              alert={sla.overdueCallbacks > 0}
            />
            <MetricRow 
              label="Avg First Response" 
              value={`${sla.avgFirstResponseMinutes} хв`}
              alert={sla.avgFirstResponseMinutes > 30}
            />
            <MetricRow 
              label="Missed SLA Rate" 
              value={`${sla.missedSlaRate}%`}
              alert={sla.missedSlaRate > 15}
            />
          </div>
        </div>

        {/* Lead Flow */}
        <div className="bg-white border border-[#D4D4D8] p-5 h-full" data-testid="lead-flow">
          <div className="flex items-center gap-2 mb-4">
            <TrendUp size={20} weight="bold" className="text-[#0055FF]" />
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Lead Flow
            </h3>
          </div>
          <div className="space-y-3">
            <MetricRow label="Нові" value={leads.newCount} color="#0055FF" />
            <MetricRow label="В роботі" value={leads.inProgressCount} color="#F59E0B" />
            <MetricRow label="Конвертовані" value={leads.convertedCount} color="#16A34A" />
            <MetricRow label="Втрачені" value={leads.lostCount} color="#DC2626" />
            <MetricRow 
              label="Без менеджера" 
              value={leads.unassignedCount} 
              alert={leads.unassignedCount > 0}
            />
          </div>
        </div>

        {/* Callback Control */}
        <div className="bg-white border border-[#D4D4D8] p-5 h-full" data-testid="callback-control">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={20} weight="bold" className="text-[#7C3AED]" />
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Callback Control
            </h3>
          </div>
          <div className="space-y-3">
            <MetricRow 
              label="Missed Calls" 
              value={callbacks.missedCalls} 
              alert={callbacks.missedCalls > 0}
            />
            <MetricRow 
              label="No Answer" 
              value={callbacks.noAnswerLeads} 
              alert={callbacks.noAnswerLeads > 3}
            />
            <MetricRow 
              label="Follow-ups due" 
              value={callbacks.followUpsDue} 
              alert={callbacks.followUpsDue > 0}
            />
            <MetricRow label="Callback заплановано" value={callbacks.callbacksScheduled} />
            <MetricRow label="SMS відправлено" value={callbacks.smsTriggered} color="#0055FF" />
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Workload Heatmap */}
        <div className="bg-white border border-[#D4D4D8] p-5" data-testid="workload-heatmap">
          <div className="flex items-center gap-2 mb-4">
            <Gauge size={20} weight="bold" className="text-[#F59E0B]" />
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Workload ({workload.totalManagers} менеджерів)
            </h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {workload.managers.map((manager) => (
              <div 
                key={manager.managerId}
                className={`flex items-center justify-between p-2 ${getWorkloadBg(manager.status)}`}
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={manager.status} />
                  <span className="text-sm font-medium truncate max-w-[120px]">{manager.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span title="Активні ліди">{manager.activeLeads} лідів</span>
                  <span title="Задачі">{manager.openTasks} задач</span>
                  <span className="font-bold">Score: {manager.score}</span>
                </div>
              </div>
            ))}
            {workload.managers.length === 0 && (
              <p className="text-sm text-[#71717A]">Немає активних менеджерів</p>
            )}
          </div>
        </div>

        {/* Deposits & Documents */}
        <div className="bg-white border border-[#D4D4D8] p-5" data-testid="deposits-docs">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={20} weight="bold" className="text-[#16A34A]" />
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Депозити & Документи
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">Депозити</span>
              <div className="space-y-2 mt-2">
                <MetricRow label="Pending" value={deposits.pendingDeposits} />
                <MetricRow 
                  label="Без proof" 
                  value={deposits.depositsWithoutProof} 
                  alert={deposits.depositsWithoutProof > 0}
                />
                <MetricRow label="Верифіковано" value={deposits.verifiedToday} color="#16A34A" />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">Документи</span>
              <div className="space-y-2 mt-2">
                <MetricRow 
                  label="На верифікацію" 
                  value={documents.pendingVerification}
                  alert={documents.pendingVerification > 3}
                />
                <MetricRow label="Відхилено" value={documents.rejectedCount} color="#DC2626" />
                <MetricRow label="Завантажено" value={documents.uploadedToday} color="#0055FF" />
              </div>
            </div>
          </div>
        </div>

        {/* Routing & System Health */}
        <div className="bg-white border border-[#D4D4D8] p-5" data-testid="routing-health">
          <div className="flex items-center gap-2 mb-4">
            <Heartbeat size={20} weight="bold" className="text-[#16A34A]" />
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              Routing & System
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">Routing</span>
              <div className="space-y-2 mt-2">
                <MetricRow 
                  label="Fallback" 
                  value={routing.fallbackAssignments}
                  alert={routing.fallbackAssignments > 5}
                />
                <MetricRow label="Reassign Rate" value={`${routing.reassignmentRate}%`} />
                <MetricRow 
                  label="Без менеджера" 
                  value={routing.unassignedLeads}
                  alert={routing.unassignedLeads > 0}
                />
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">System</span>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <SystemStatusBadge status={system.systemStatus} />
                </div>
                <MetricRow label="Queue" value={system.queueBacklog} />
                <MetricRow 
                  label="Помилки" 
                  value={system.failedJobs}
                  alert={system.failedJobs > 0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const KpiCard = ({ icon: Icon, label, value, color, bgColor, alert }) => (
  <div 
    className={`p-4 border ${alert ? 'border-[#DC2626] bg-[#FEE2E2]' : 'border-[#D4D4D8] bg-white'}`}
    data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <Icon size={16} weight="bold" style={{ color }} />
      </div>
    </div>
    <div className="text-2xl font-bold tracking-tight">{value}</div>
    <div className="text-xs font-semibold uppercase tracking-wide text-[#71717A]">{label}</div>
  </div>
);

const MetricRow = ({ label, value, color, alert }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-[#71717A]">{label}</span>
    <span 
      className={`text-sm font-semibold ${alert ? 'text-[#DC2626]' : ''}`}
      style={{ color: !alert && color ? color : undefined }}
    >
      {value}
    </span>
  </div>
);

const StatusDot = ({ status }) => {
  const colors = {
    ok: '#16A34A',
    busy: '#F59E0B',
    overloaded: '#DC2626',
    idle: '#71717A',
  };
  return (
    <span 
      className="w-2 h-2 rounded-full inline-block"
      style={{ backgroundColor: colors[status] || '#71717A' }}
    />
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
    healthy: { bg: '#D1FAE5', color: '#16A34A', label: 'Healthy' },
    warning: { bg: '#FEF3C7', color: '#F59E0B', label: 'Warning' },
    critical: { bg: '#FEE2E2', color: '#DC2626', label: 'Critical' },
  };
  const config = configs[status] || configs.healthy;
  return (
    <span 
      className="px-2 py-1 text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
};

export default Dashboard;
