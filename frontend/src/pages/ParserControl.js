/**
 * Parser Control Center - Main Page
 * 
 * Для MASTER_ADMIN: повний контроль
 * Для MODERATOR: тільки перегляд статусу
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth, API_URL } from '../App';
import {
  Play,
  Pause,
  ArrowClockwise,
  Warning,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Pulse,
  Gear,
  CaretRight,
  Lightning,
  ShieldCheck,
  CircleNotch,
} from '@phosphor-icons/react';

// Status badge component
const StatusBadge = ({ status }) => {
  const config = {
    running: { color: 'bg-blue-100 text-blue-700', icon: CircleNotch, animate: true },
    idle: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    stopped: { color: 'bg-gray-100 text-gray-600', icon: Pause },
    degraded: { color: 'bg-yellow-100 text-yellow-700', icon: Warning },
    error: { color: 'bg-red-100 text-red-700', icon: XCircle },
  }[status] || { color: 'bg-gray-100 text-gray-600', icon: Pulse };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={14} weight="bold" className={config.animate ? 'animate-spin' : ''} />
      {status?.toUpperCase()}
    </span>
  );
};

// Circuit breaker badge
const CircuitBadge = ({ state }) => {
  const config = {
    closed: { color: 'bg-green-100 text-green-700', label: 'OK' },
    'half-open': { color: 'bg-yellow-100 text-yellow-700', label: 'RECOVERING' },
    open: { color: 'bg-red-100 text-red-700', label: 'OPEN' },
  }[state] || { color: 'bg-gray-100 text-gray-600', label: state };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
      <ShieldCheck size={12} />
      {config.label}
    </span>
  );
};

// Parser Card Component
const ParserCard = ({ parser, onRun, onStop, onResume, onResetCircuit, isMasterAdmin, loading }) => {
  const formatDate = (date) => {
    if (!date) return 'Ніколи';
    return new Date(date).toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 hover:shadow-lg transition-shadow" data-testid={`parser-card-${parser.source}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#18181B] rounded-xl flex items-center justify-center">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#18181B] uppercase">{parser.source}</h3>
            <p className="text-xs text-[#71717A]">{parser.cronExpression || 'No schedule'}</p>
          </div>
        </div>
        <StatusBadge status={parser.status} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-[#F4F4F5] rounded-xl">
          <p className="text-2xl font-bold text-[#18181B]">{parser.itemsParsed || 0}</p>
          <p className="text-xs text-[#71717A]">Оброблено</p>
        </div>
        <div className="text-center p-3 bg-[#F4F4F5] rounded-xl">
          <p className="text-2xl font-bold text-green-600">{parser.itemsCreated || 0}</p>
          <p className="text-xs text-[#71717A]">Створено</p>
        </div>
        <div className="text-center p-3 bg-[#F4F4F5] rounded-xl">
          <p className="text-2xl font-bold text-red-500">{parser.errorsCount || 0}</p>
          <p className="text-xs text-[#71717A]">Помилок</p>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-[#71717A]">Останній запуск:</span>
          <span className="font-medium">{formatDate(parser.lastRunAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#71717A]">Останній успіх:</span>
          <span className="font-medium text-green-600">{formatDate(parser.lastSuccessAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#71717A]">Тривалість:</span>
          <span className="font-medium">{formatDuration(parser.lastDurationMs)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#71717A]">Circuit Breaker:</span>
          <CircuitBadge state={parser.circuitState || 'closed'} />
        </div>
      </div>

      {/* Actions - only for master_admin */}
      {isMasterAdmin && (
        <div className="flex gap-2 pt-4 border-t border-[#E4E4E7]">
          {parser.isPaused ? (
            <button
              onClick={() => onResume(parser.source)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
              data-testid={`resume-${parser.source}`}
            >
              <Play size={16} weight="fill" />
              Відновити
            </button>
          ) : (
            <>
              <button
                onClick={() => onRun(parser.source)}
                disabled={loading || parser.status === 'running'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#18181B] text-white rounded-xl hover:bg-[#27272A] transition-colors disabled:opacity-50"
                data-testid={`run-${parser.source}`}
              >
                {loading ? <CircleNotch size={16} className="animate-spin" /> : <Play size={16} weight="fill" />}
                Запустити
              </button>
              <button
                onClick={() => onStop(parser.source)}
                disabled={loading}
                className="px-4 py-2.5 border border-[#E4E4E7] rounded-xl hover:bg-[#F4F4F5] transition-colors disabled:opacity-50"
                data-testid={`stop-${parser.source}`}
              >
                <Pause size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => onResetCircuit(parser.source)}
            disabled={loading}
            className="px-4 py-2.5 border border-[#E4E4E7] rounded-xl hover:bg-[#F4F4F5] transition-colors disabled:opacity-50"
            title="Reset Circuit Breaker"
            data-testid={`reset-circuit-${parser.source}`}
          >
            <ArrowClockwise size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// Health Overview Component
const HealthOverview = ({ health }) => {
  if (!health) return null;

  const statusConfig = {
    healthy: { color: 'text-green-600', bg: 'bg-green-50', label: 'Система працює нормально' },
    degraded: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Є проблеми' },
    critical: { color: 'text-red-600', bg: 'bg-red-50', label: 'Критичний стан' },
  }[health.status] || { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Невідомо' };

  return (
    <div className={`rounded-2xl p-6 ${statusConfig.bg} mb-6`} data-testid="health-overview">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pulse size={24} className={statusConfig.color} weight="bold" />
          <div>
            <h3 className={`font-semibold ${statusConfig.color}`}>{statusConfig.label}</h3>
            <p className="text-sm text-[#71717A]">
              Success Rate: {health.metrics?.successRate24h || 100}% | 
              Помилок за годину: {health.metrics?.errorsLastHour || 0}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{health.proxies?.available || 0}/{health.proxies?.total || 0}</p>
            <p className="text-xs text-[#71717A]">Проксі</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{(health.alerts?.critical || 0) + (health.alerts?.warning || 0)}</p>
            <p className="text-xs text-[#71717A]">Алертів</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alerts Section
const AlertsSection = ({ alerts, onResolve, isMasterAdmin }) => {
  if (!alerts || alerts.length === 0) return null;

  const levelConfig = {
    critical: { color: 'border-red-200 bg-red-50', icon: XCircle, iconColor: 'text-red-500' },
    warning: { color: 'border-yellow-200 bg-yellow-50', icon: Warning, iconColor: 'text-yellow-500' },
    info: { color: 'border-blue-200 bg-blue-50', icon: Pulse, iconColor: 'text-blue-500' },
  };

  return (
    <div className="mb-6" data-testid="alerts-section">
      <h3 className="font-semibold text-[#18181B] mb-3 flex items-center gap-2">
        <Warning size={18} className="text-yellow-500" />
        Активні алерти ({alerts.length})
      </h3>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert) => {
          const config = levelConfig[alert.level] || levelConfig.info;
          const Icon = config.icon;
          return (
            <div key={alert.id || alert._id} className={`flex items-center justify-between p-3 rounded-xl border ${config.color}`}>
              <div className="flex items-center gap-3">
                <Icon size={18} className={config.iconColor} />
                <div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-[#71717A]">{alert.source} • {new Date(alert.createdAt).toLocaleString('uk-UA')}</p>
                </div>
              </div>
              {isMasterAdmin && (
                <button
                  onClick={() => onResolve(alert.id || alert._id)}
                  className="text-xs px-3 py-1 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Закрити
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Component
const ParserControl = () => {
  const { user } = useAuth();
  const [parsers, setParsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const isMasterAdmin = user?.role === 'master_admin';

  const fetchData = useCallback(async () => {
    try {
      const [parsersRes, healthRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/api/ingestion/admin/parsers`),
        axios.get(`${API_URL}/api/ingestion/admin/health`),
        axios.get(`${API_URL}/api/ingestion/admin/alerts`),
      ]);

      setParsers(parsersRes.data.parsers || []);
      setHealth(healthRes.data);
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('Error fetching parser data:', error);
      toast.error('Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRun = async (source) => {
    setActionLoading(source);
    try {
      const res = await axios.post(`${API_URL}/api/ingestion/admin/parsers/${source}/run`);
      if (res.data.success) {
        toast.success(`${source.toUpperCase()} запущено`);
      } else {
        toast.error(res.data.error || 'Помилка запуску');
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Помилка запуску парсера');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (source) => {
    setActionLoading(source);
    try {
      await axios.post(`${API_URL}/api/ingestion/admin/parsers/${source}/stop`);
      toast.success(`${source.toUpperCase()} зупинено`);
      fetchData();
    } catch (error) {
      toast.error('Помилка зупинки парсера');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (source) => {
    setActionLoading(source);
    try {
      await axios.post(`${API_URL}/api/ingestion/admin/parsers/${source}/resume`);
      toast.success(`${source.toUpperCase()} відновлено`);
      fetchData();
    } catch (error) {
      toast.error('Помилка відновлення');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetCircuit = async (source) => {
    try {
      await axios.post(`${API_URL}/api/ingestion/admin/parsers/${source}/circuit-breaker/reset`);
      toast.success('Circuit breaker скинуто');
      fetchData();
    } catch (error) {
      toast.error('Помилка скидання');
    }
  };

  const handleRunAll = async () => {
    setActionLoading('all');
    try {
      await axios.post(`${API_URL}/api/ingestion/admin/parsers/run-all`);
      toast.success('Всі парсери запущено');
      fetchData();
    } catch (error) {
      toast.error('Помилка запуску');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopAll = async () => {
    setActionLoading('all');
    try {
      await axios.post(`${API_URL}/api/ingestion/admin/parsers/stop-all`);
      toast.success('Всі парсери зупинено');
      fetchData();
    } catch (error) {
      toast.error('Помилка зупинки');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await axios.post(`${API_URL}/api/ingestion/admin/alerts/${id}/resolve`);
      toast.success('Алерт закрито');
      fetchData();
    } catch (error) {
      toast.error('Помилка закриття алерту');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CircleNotch size={32} className="animate-spin text-[#18181B]" />
      </div>
    );
  }

  return (
    <div data-testid="parser-control-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#18181B]">Parser Control Center</h1>
          <p className="text-[#71717A]">Керування парсерами та моніторинг</p>
        </div>
        {isMasterAdmin && (
          <div className="flex gap-2">
            <button
              onClick={handleRunAll}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#18181B] text-white rounded-xl hover:bg-[#27272A] transition-colors disabled:opacity-50"
              data-testid="run-all-btn"
            >
              <Lightning size={18} weight="fill" />
              Запустити все
            </button>
            <button
              onClick={handleStopAll}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#E4E4E7] rounded-xl hover:bg-[#F4F4F5] transition-colors disabled:opacity-50"
              data-testid="stop-all-btn"
            >
              <Pause size={18} />
              Зупинити все
            </button>
          </div>
        )}
      </div>

      {/* Health Overview */}
      <HealthOverview health={health} />

      {/* Alerts */}
      <AlertsSection alerts={alerts} onResolve={handleResolveAlert} isMasterAdmin={isMasterAdmin} />

      {/* Parser Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {parsers.map((parser) => (
          <ParserCard
            key={parser.source}
            parser={parser}
            onRun={handleRun}
            onStop={handleStop}
            onResume={handleResume}
            onResetCircuit={handleResetCircuit}
            isMasterAdmin={isMasterAdmin}
            loading={actionLoading === parser.source || actionLoading === 'all'}
          />
        ))}
      </div>

      {/* Quick Links for master_admin */}
      {isMasterAdmin && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <a href="/parser/proxies" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E4E4E7] hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#F4F4F5] rounded-lg flex items-center justify-center">
              <Pulse size={20} />
            </div>
            <div>
              <p className="font-medium">Проксі</p>
              <p className="text-xs text-[#71717A]">Керування проксі</p>
            </div>
            <CaretRight size={16} className="ml-auto text-[#71717A]" />
          </a>
          <a href="/parser/logs" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E4E4E7] hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#F4F4F5] rounded-lg flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="font-medium">Логи</p>
              <p className="text-xs text-[#71717A]">Історія запусків</p>
            </div>
            <CaretRight size={16} className="ml-auto text-[#71717A]" />
          </a>
          <a href="/parser/settings" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E4E4E7] hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#F4F4F5] rounded-lg flex items-center justify-center">
              <Gear size={20} />
            </div>
            <div>
              <p className="font-medium">Налаштування</p>
              <p className="text-xs text-[#71717A]">Конфігурація</p>
            </div>
            <CaretRight size={16} className="ml-auto text-[#71717A]" />
          </a>
          <a href="/vehicles" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E4E4E7] hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#F4F4F5] rounded-lg flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <p className="font-medium">Авто</p>
              <p className="text-xs text-[#71717A]">База транспорту</p>
            </div>
            <CaretRight size={16} className="ml-auto text-[#71717A]" />
          </a>
        </div>
      )}
    </div>
  );
};

export default ParserControl;
