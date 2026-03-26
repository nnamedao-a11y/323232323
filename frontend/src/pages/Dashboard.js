import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { motion } from 'framer-motion';
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
  CaretDown,
  ArrowUp,
  ArrowDown
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
        <div className="animate-spin w-8 h-8 border-2 border-[#4F46E5] border-t-transparent rounded-full"></div>
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
    day: 'Сьогодні',
    week: 'Тиждень',
    month: 'Місяць',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      data-testid="master-dashboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white font-heading">
            Control Dashboard
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
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
      </motion.div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="card-premium bg-[#EF4444]/10 border-[#EF4444]/30 p-5 mb-6"
          data-testid="critical-alerts"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#EF4444]/20 rounded-xl flex items-center justify-center">
              <Warning size={20} weight="fill" className="text-[#EF4444]" />
            </div>
            <span className="text-sm font-semibold text-[#EF4444] uppercase tracking-wide">
              Критичні сповіщення ({criticalAlerts.length})
            </span>
          </div>
          <ul className="space-y-1 ml-[52px]">
            {criticalAlerts.map((alert, i) => (
              <li key={i} className="text-sm text-[#FCA5A5]">• {alert}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* KPI Summary Row */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6" 
        data-testid="kpi-summary-row"
      >
        <KpiCard 
          icon={Users} 
          label="Нові ліди" 
          value={leads.newCount} 
          glowClass="glow-blue"
        />
        <KpiCard 
          icon={Warning} 
          label="Прострочені" 
          value={sla.overdueLeads} 
          glowClass="glow-red"
          alert={sla.overdueLeads > 0}
        />
        <KpiCard 
          icon={Wallet} 
          label="Pending депозити" 
          value={deposits.pendingDeposits} 
          glowClass="glow-violet"
        />
        <KpiCard 
          icon={FileText} 
          label="На верифікацію" 
          value={documents.pendingVerification} 
          glowClass="glow-amber"
          alert={documents.pendingVerification > 5}
        />
        <KpiCard 
          icon={UserCircle} 
          label="Перевантажені" 
          value={workload.overloadedManagers} 
          glowClass={workload.overloadedManagers > 0 ? "glow-red" : "glow-emerald"}
          alert={workload.overloadedManagers > 0}
        />
        <KpiCard 
          icon={Lightning} 
          label="Failed Jobs" 
          value={system.failedJobs} 
          glowClass={system.failedJobs > 0 ? "glow-red" : "glow-emerald"}
        />
      </motion.div>

      {/* Main Grid - Row 1 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* SLA Control */}
        <div className="card-premium" data-testid="sla-control">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#EF4444]/10 rounded-xl flex items-center justify-center">
              <Clock size={20} weight="bold" className="text-[#EF4444]" />
            </div>
            <h3 className="text-lg font-medium text-white font-heading">
              SLA Control
            </h3>
          </div>
          <div className="space-y-4">
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
        <div className="card-premium" data-testid="lead-flow">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#4F46E5]/10 rounded-xl flex items-center justify-center">
              <TrendUp size={20} weight="bold" className="text-[#818CF8]" />
            </div>
            <h3 className="text-lg font-medium text-white font-heading">
              Lead Flow
            </h3>
          </div>
          <div className="space-y-4">
            <MetricRow label="Нові" value={leads.newCount} color="text-[#818CF8]" />
            <MetricRow label="В роботі" value={leads.inProgressCount} color="text-[#FBBF24]" />
            <MetricRow label="Конвертовані" value={leads.convertedCount} color="text-[#34D399]" />
            <MetricRow label="Втрачені" value={leads.lostCount} color="text-[#F87171]" />
            <MetricRow 
              label="Без менеджера" 
              value={leads.unassignedCount} 
              alert={leads.unassignedCount > 0}
            />
          </div>
        </div>

        {/* Callback Control */}
        <div className="card-premium" data-testid="callback-control">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center">
              <Phone size={20} weight="bold" className="text-[#A78BFA]" />
            </div>
            <h3 className="text-lg font-medium text-white font-heading">
              Callback Control
            </h3>
          </div>
          <div className="space-y-4">
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
            <MetricRow label="SMS відправлено" value={callbacks.smsTriggered} color="text-[#818CF8]" />
          </div>
        </div>
      </motion.div>

      {/* Main Grid - Row 2 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workload Heatmap */}
        <div className="card-premium" data-testid="workload-heatmap">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center">
              <Gauge size={20} weight="bold" className="text-[#FBBF24]" />
            </div>
            <h3 className="text-lg font-medium text-white font-heading">
              Workload <span className="text-[#64748B] font-normal text-sm">({workload.totalManagers})</span>
            </h3>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-2">
            {workload.managers.map((manager) => (
              <div 
                key={manager.managerId}
                className={`flex items-center justify-between p-3 rounded-xl ${getWorkloadBg(manager.status)}`}
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={manager.status} />
                  <span className="text-sm font-medium text-white truncate max-w-[100px]">{manager.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                  <span>{manager.activeLeads} лідів</span>
                  <span>{manager.openTasks} задач</span>
                  <span className="font-semibold text-white bg-white/10 px-2 py-1 rounded-lg">
                    {manager.score}
                  </span>
                </div>
              </div>
            ))}
            {workload.managers.length === 0 && (
              <p className="text-sm text-[#64748B] text-center py-4">Немає активних менеджерів</p>
            )}
          </div>
        </div>

        {/* Deposits & Documents */}
        <div className="card-premium" data-testid="deposits-docs">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
              <Wallet size={20} weight="bold" className="text-[#34D399]" />
            </div>
            <h3 className="text-lg font-medium text-white font-heading">
              Депозити & Документи
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">Депозити</p>
              <div className="space-y-3">
                <MetricRow label="Pending" value={deposits.pendingDeposits} />
                <MetricRow 
                  label="Без proof" 
                  value={deposits.depositsWithoutProof} 
                  alert={deposits.depositsWithoutProof > 0}
                />
                <MetricRow label="Верифіковано" value={deposits.verifiedToday} color="text-[#34D399]" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">Документи</p>
              <div className="space-y-3">
                <MetricRow 
                  label="На верифікацію" 
                  value={documents.pendingVerification}
                  alert={documents.pendingVerification > 3}
                />
                <MetricRow label="Відхилено" value={documents.rejectedCount} color="text-[#F87171]" />
                <MetricRow label="Завантажено" value={documents.uploadedToday} color="text-[#818CF8]" />
              </div>
            </div>
          </div>
        </div>

        {/* Routing & System Health */}
        <div className="card-premium" data-testid="routing-health">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
              <Heartbeat size={20} weight="bold" className="text-[#34D399]" />
            </div>
            <h3 className="text-lg font-medium text-white font-heading">
              Routing & System
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">Routing</p>
              <div className="space-y-3">
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
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-3">System</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#94A3B8]">Status</span>
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
      </motion.div>
    </motion.div>
  );
};

// Helper Components
const KpiCard = ({ icon: Icon, label, value, glowClass, alert }) => (
  <div 
    className={`kpi-card group ${alert ? 'border-[#EF4444]/30' : ''}`}
    data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}
  >
    <div className={glowClass}></div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          alert ? 'bg-[#EF4444]/10' : 'bg-white/5'
        }`}>
          <Icon size={20} weight="bold" className={alert ? 'text-[#EF4444]' : 'text-[#94A3B8]'} />
        </div>
      </div>
      <div className={`kpi-value ${alert ? 'text-[#EF4444]' : ''}`}>{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  </div>
);

const MetricRow = ({ label, value, color, alert }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-[#94A3B8]">{label}</span>
    <span 
      className={`text-sm font-medium ${alert ? 'text-[#EF4444]' : color || 'text-white'}`}
    >
      {value}
    </span>
  </div>
);

const StatusDot = ({ status }) => {
  const colors = {
    ok: 'bg-[#10B981]',
    busy: 'bg-[#F59E0B]',
    overloaded: 'bg-[#EF4444]',
    idle: 'bg-[#64748B]',
  };
  return (
    <span className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-[#64748B]'}`} />
  );
};

const getWorkloadBg = (status) => {
  const bgs = {
    ok: 'bg-[#10B981]/10',
    busy: 'bg-[#F59E0B]/10',
    overloaded: 'bg-[#EF4444]/10',
    idle: 'bg-white/5',
  };
  return bgs[status] || 'bg-white/5';
};

const SystemStatusBadge = ({ status }) => {
  const configs = {
    healthy: { bg: 'bg-[#10B981]/15', color: 'text-[#34D399]', border: 'border-[#10B981]/30', label: 'Healthy' },
    warning: { bg: 'bg-[#F59E0B]/15', color: 'text-[#FBBF24]', border: 'border-[#F59E0B]/30', label: 'Warning' },
    critical: { bg: 'bg-[#EF4444]/15', color: 'text-[#F87171]', border: 'border-[#EF4444]/30', label: 'Critical' },
  };
  const config = configs[status] || configs.healthy;
  return (
    <span className={`badge-premium ${config.bg} ${config.color} ${config.border}`}>
      {config.label}
    </span>
  );
};

export default Dashboard;
