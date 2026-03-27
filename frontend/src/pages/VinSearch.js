/**
 * VIN Search Page - Admin Panel
 * 
 * VIN Intelligence Engine з керуванням джерелами
 */

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlass, 
  Car, 
  Tag, 
  Calendar, 
  MapPin, 
  SpinnerGap, 
  CheckCircle, 
  XCircle, 
  Images,
  Database,
  Globe,
  Lightning,
  Gauge,
  ArrowsClockwise,
  Sliders,
  Power,
  CaretRight,
  Clock,
  ChartBar
} from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth, API_URL } from '../App';

// Source type badge
const SourceTypeBadge = ({ type }) => {
  const config = {
    database: { color: 'bg-blue-100 text-blue-700', label: 'База' },
    aggregator: { color: 'bg-green-100 text-green-700', label: 'Агрегатор' },
    competitor: { color: 'bg-yellow-100 text-yellow-700', label: 'Конкурент' },
    web_search: { color: 'bg-purple-100 text-purple-700', label: 'Web' },
  };
  const cfg = config[type] || { color: 'bg-gray-100 text-gray-600', label: type };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
};

// Success rate display
const SuccessRate = ({ successCount, failCount }) => {
  const total = successCount + failCount;
  if (total === 0) return <span className="text-[#71717A]">—</span>;
  const rate = Math.round((successCount / total) * 100);
  const color = rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600';
  return <span className={`font-semibold ${color}`}>{rate}%</span>;
};

const VinSearch = () => {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === 'master_admin';
  
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Sources state
  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setSourcesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/sources`);
      setSources(response.data.sources || []);
      setStats(response.data.stats || null);
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setSourcesLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!vin || vin.length < 11) {
      setError('Введіть коректний VIN (17 символів)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.get(`${API_URL}/api/vin/search?vin=${vin.toUpperCase()}`);
      setResult(response.data);
      // Refresh sources to update stats
      fetchSources();
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка пошуку');
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = async (name, enabled) => {
    try {
      await axios.patch(`${API_URL}/api/admin/sources/${name}/toggle`, { enabled: !enabled });
      toast.success(`Джерело ${name} ${!enabled ? 'увімкнено' : 'вимкнено'}`);
      fetchSources();
    } catch (err) {
      toast.error('Помилка оновлення');
    }
  };

  const updateWeight = async (name, weight) => {
    try {
      await axios.patch(`${API_URL}/api/admin/sources/${name}/weight`, { weight });
      toast.success(`Вага для ${name} оновлена`);
      fetchSources();
    } catch (err) {
      toast.error('Помилка оновлення');
    }
  };

  const resetStats = async (name) => {
    try {
      await axios.post(`${API_URL}/api/admin/sources/${name}/reset-stats`);
      toast.success(`Статистика ${name} скинута`);
      fetchSources();
    } catch (err) {
      toast.error('Помилка скидання');
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Н/Д';
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD' }).format(price);
  };

  const formatDate = (date) => {
    if (!date) return 'Н/Д';
    return new Date(date).toLocaleDateString('uk-UA');
  };

  return (
    <div data-testid="vin-search-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            VIN Intelligence Engine
          </h1>
          <p className="text-sm text-[#71717A] mt-1">
            Пошук інформації про авто за VIN кодом
          </p>
        </div>
        <button
          onClick={() => setShowSources(!showSources)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E4E4E7] rounded-xl text-[#18181B] hover:bg-[#F4F4F5] transition-all"
          data-testid="toggle-sources-btn"
        >
          <Sliders size={18} />
          <span>Джерела</span>
          <CaretRight size={14} className={`transition-transform ${showSources ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Sources Panel */}
      {showSources && (
        <div className="mb-6 bg-white rounded-2xl border border-[#E4E4E7] p-6" data-testid="sources-panel">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#18181B] flex items-center gap-2">
              <Database size={20} />
              Джерела даних
            </h2>
            {stats && (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#71717A]">Всього: <b className="text-[#18181B]">{stats.total}</b></span>
                <span className="text-green-600">Активних: <b>{stats.enabled}</b></span>
                <span className="text-[#71717A]">Вимкнено: <b>{stats.disabled}</b></span>
              </div>
            )}
          </div>

          {sourcesLoading ? (
            <div className="flex items-center justify-center py-8">
              <SpinnerGap size={24} className="animate-spin text-[#71717A]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4E4E7]">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider">Джерело</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider">Тип</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider">Статус</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider">Вага</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider">Success Rate</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider">Avg Time</th>
                    {isMasterAdmin && (
                      <th className="text-right py-3 px-4 text-xs font-semibold text-[#71717A] uppercase tracking-wider">Дії</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.name} className="border-b border-[#F4F4F5] hover:bg-[#FAFAFA] transition-colors" data-testid={`source-row-${source.name}`}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-[#18181B]">{source.displayName || source.name}</p>
                          <p className="text-xs text-[#71717A]">{source.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <SourceTypeBadge type={source.type} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => isMasterAdmin && toggleSource(source.name, source.enabled)}
                          disabled={!isMasterAdmin}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            source.enabled 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          } ${!isMasterAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                          data-testid={`toggle-${source.name}`}
                        >
                          <Power size={12} weight="bold" />
                          {source.enabled ? 'ON' : 'OFF'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isMasterAdmin ? (
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(source.weight * 100)}
                            onChange={(e) => updateWeight(source.name, e.target.value / 100)}
                            className="w-16 h-1 accent-[#18181B]"
                            data-testid={`weight-${source.name}`}
                          />
                        ) : null}
                        <span className="ml-2 text-sm font-medium text-[#18181B]">{Math.round(source.weight * 100)}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <SuccessRate successCount={source.successCount} failCount={source.failCount} />
                        <span className="text-xs text-[#71717A] ml-1">
                          ({source.successCount}/{source.successCount + source.failCount})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-[#71717A]">
                        {source.avgResponseTime > 0 ? `${source.avgResponseTime}ms` : '—'}
                      </td>
                      {isMasterAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => resetStats(source.name)}
                            className="text-xs text-[#71717A] hover:text-[#18181B] transition-colors"
                            data-testid={`reset-${source.name}`}
                          >
                            <ArrowsClockwise size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
              placeholder="Введіть VIN код (17 символів)"
              className="w-full pl-12 pr-16 py-3.5 bg-[#F4F4F5] border border-transparent rounded-xl text-[#18181B] text-lg font-mono tracking-wider placeholder:text-[#A1A1AA] focus:bg-white focus:border-[#18181B] focus:outline-none transition-all"
              maxLength={17}
              data-testid="vin-search-input"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] text-sm font-mono">
              {vin.length}/17
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || vin.length < 11}
            className="px-8 py-3.5 bg-[#18181B] text-white font-semibold rounded-xl hover:bg-[#27272A] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            data-testid="vin-search-button"
          >
            {loading ? (
              <SpinnerGap size={20} className="animate-spin" />
            ) : (
              <MagnifyingGlass size={20} weight="bold" />
            )}
            {loading ? 'Пошук...' : 'Знайти'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700" data-testid="search-error">
          <XCircle size={20} weight="fill" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden" data-testid="search-result">
          {/* Status Banner */}
          <div className={`px-6 py-4 flex items-center justify-between ${
            result.success ? 'bg-green-50 border-b border-green-200' : 'bg-yellow-50 border-b border-yellow-200'
          }`}>
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle size={24} weight="fill" className="text-green-600" />
              ) : (
                <XCircle size={24} weight="fill" className="text-yellow-600" />
              )}
              <div>
                <p className={`font-semibold ${result.success ? 'text-green-700' : 'text-yellow-700'}`}>
                  {result.message}
                </p>
                <p className="text-sm text-[#71717A]">
                  Джерело: <span className="font-mono">{result.source}</span> • 
                  Час пошуку: {result.searchDurationMs}ms
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-white/80 rounded-lg border border-[#E4E4E7]">
              <span className="font-mono text-sm text-[#18181B]">{result.vin}</span>
            </div>
          </div>

          {/* Vehicle Details */}
          {result.vehicle && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Image */}
                <div className="lg:col-span-1">
                  {result.vehicle.images?.length > 0 || result.vehicle.primaryImage ? (
                    <img
                      src={result.vehicle.primaryImage || result.vehicle.images[0]}
                      alt={result.vehicle.title}
                      className="w-full h-56 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-56 bg-[#F4F4F5] rounded-xl flex items-center justify-center">
                      <Car size={64} className="text-[#D4D4D8]" />
                    </div>
                  )}
                  
                  {result.vehicle.images?.length > 1 && (
                    <div className="mt-3 flex items-center gap-2 text-[#71717A] text-sm">
                      <Images size={16} />
                      {result.vehicle.images.length} фото
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Title & Price */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-[#18181B]">
                        {result.vehicle.title || `${result.vehicle.year || ''} ${result.vehicle.make || ''} ${result.vehicle.vehicleModel || result.vehicle.model || ''}`}
                      </h2>
                      <p className="text-[#71717A] font-mono text-sm mt-1">
                        VIN: {result.vehicle.vin}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#18181B]">
                        {formatPrice(result.vehicle.price)}
                      </p>
                      {result.vehicle.score && (
                        <p className="text-sm text-[#71717A] flex items-center gap-1 justify-end">
                          <Gauge size={14} />
                          Якість: {Math.round(result.vehicle.score * 100)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#F4F4F5] rounded-xl">
                      <p className="text-[#71717A] text-xs uppercase tracking-wider mb-0.5">Рік</p>
                      <p className="text-[#18181B] font-semibold">{result.vehicle.year || 'Н/Д'}</p>
                    </div>
                    <div className="p-3 bg-[#F4F4F5] rounded-xl">
                      <p className="text-[#71717A] text-xs uppercase tracking-wider mb-0.5">Пробіг</p>
                      <p className="text-[#18181B] font-semibold">
                        {result.vehicle.mileage ? `${result.vehicle.mileage.toLocaleString()} ${result.vehicle.mileageUnit || 'mi'}` : 'Н/Д'}
                      </p>
                    </div>
                    <div className="p-3 bg-[#F4F4F5] rounded-xl">
                      <p className="text-[#71717A] text-xs uppercase tracking-wider mb-0.5">Пошкодження</p>
                      <p className="text-[#18181B] font-semibold capitalize">
                        {result.vehicle.damageType || result.vehicle.damageDescription || 'Н/Д'}
                      </p>
                    </div>
                    <div className="p-3 bg-[#F4F4F5] rounded-xl flex items-start gap-2">
                      <Calendar size={16} className="text-[#71717A] mt-0.5" />
                      <div>
                        <p className="text-[#71717A] text-xs uppercase tracking-wider mb-0.5">Дата аукціону</p>
                        <p className="text-[#18181B] font-semibold">
                          {formatDate(result.vehicle.auctionDate || result.vehicle.saleDate)}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-[#F4F4F5] rounded-xl flex items-start gap-2">
                      <MapPin size={16} className="text-[#71717A] mt-0.5" />
                      <div>
                        <p className="text-[#71717A] text-xs uppercase tracking-wider mb-0.5">Локація</p>
                        <p className="text-[#18181B] font-semibold">
                          {result.vehicle.auctionLocation || result.vehicle.location || 'Н/Д'}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-[#F4F4F5] rounded-xl flex items-start gap-2">
                      <Tag size={16} className="text-[#71717A] mt-0.5" />
                      <div>
                        <p className="text-[#71717A] text-xs uppercase tracking-wider mb-0.5">Lot #</p>
                        <p className="text-[#18181B] font-semibold font-mono">
                          {result.vehicle.lotNumber || result.vehicle.externalId || 'Н/Д'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sources */}
                  {result.vehicle.sources && result.vehicle.sources.length > 0 && (
                    <div className="pt-4 border-t border-[#E4E4E7]">
                      <p className="text-[#71717A] text-xs uppercase tracking-wider mb-2">Джерела даних</p>
                      <div className="flex flex-wrap gap-2">
                        {result.vehicle.sources.map((src, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-[#F4F4F5] rounded-lg text-sm text-[#52525B] capitalize">
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source URL */}
                  {result.vehicle.sourceUrl && (
                    <a
                      href={result.vehicle.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#18181B] hover:underline text-sm font-medium"
                    >
                      <Globe size={14} />
                      Переглянути на джерелі →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Not Found State */}
          {!result.success && !result.vehicle && (
            <div className="p-12 text-center">
              <Car size={64} className="mx-auto text-[#D4D4D8] mb-4" />
              <h3 className="text-xl text-[#18181B] font-semibold mb-2">
                Інформацію не знайдено
              </h3>
              <p className="text-[#71717A] max-w-md mx-auto">
                Система не знайшла інформацію про цей VIN код. Перевірте правильність VIN або спробуйте пізніше.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-[#E4E4E7] rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database size={16} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-[#18181B]">Database Search</h3>
          </div>
          <p className="text-[#71717A] text-sm">
            Пошук у власній базі vehicles
          </p>
        </div>
        <div className="p-4 bg-white border border-[#E4E4E7] rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-[#18181B]">Multi-Source</h3>
          </div>
          <p className="text-[#71717A] text-sm">
            Пошук через {sources.filter(s => s.enabled).length}+ активних джерел
          </p>
        </div>
        <div className="p-4 bg-white border border-[#E4E4E7] rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Lightning size={16} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-[#18181B]">Smart Caching</h3>
          </div>
          <p className="text-[#71717A] text-sm">
            Кешування на 7 днів для швидкості
          </p>
        </div>
      </div>
    </div>
  );
};

export default VinSearch;
