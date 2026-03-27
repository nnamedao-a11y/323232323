import React, { useState } from 'react';
import { MagnifyingGlass, Car, Tag, Calendar, MapPin, CurrencyDollar, SpinnerGap, CheckCircle, XCircle, Images } from '@phosphor-icons/react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const VinSearch = () => {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка пошуку');
    } finally {
      setLoading(false);
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MagnifyingGlass size={32} weight="bold" className="text-[#00D4FF]" />
          VIN Intelligence Engine
        </h1>
        <p className="text-gray-400">
          Пошук інформації про авто за VIN кодом • 100% coverage
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''))}
              placeholder="Введіть VIN код (наприклад: 1HGBH41JXMN109186)"
              className="w-full px-4 py-4 bg-[#1E2530] border border-[#2D3748] rounded-xl text-white text-lg font-mono tracking-wider placeholder:text-gray-500 focus:border-[#00D4FF] focus:outline-none transition-colors"
              maxLength={17}
              data-testid="vin-search-input"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              {vin.length}/17
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || vin.length < 11}
            className="px-8 py-4 bg-gradient-to-r from-[#00D4FF] to-[#00A3CC] text-[#0A0E17] font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00D4FF]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            data-testid="vin-search-button"
          >
            {loading ? (
              <SpinnerGap size={24} className="animate-spin" />
            ) : (
              <MagnifyingGlass size={24} weight="bold" />
            )}
            {loading ? 'Пошук...' : 'Знайти'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400">
          <XCircle size={24} />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[#151A23] border border-[#2D3748] rounded-2xl overflow-hidden">
          {/* Status Banner */}
          <div className={`px-6 py-4 flex items-center justify-between ${
            result.success ? 'bg-green-500/10 border-b border-green-500/20' : 'bg-orange-500/10 border-b border-orange-500/20'
          }`}>
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle size={28} weight="fill" className="text-green-500" />
              ) : (
                <XCircle size={28} weight="fill" className="text-orange-500" />
              )}
              <div>
                <p className={`font-semibold ${result.success ? 'text-green-400' : 'text-orange-400'}`}>
                  {result.message}
                </p>
                <p className="text-sm text-gray-400">
                  Джерело: <span className="font-mono">{result.source}</span> • 
                  Час пошуку: {result.searchDurationMs}ms
                </p>
              </div>
            </div>
            <div className="px-4 py-1 bg-[#0A0E17]/50 rounded-full">
              <span className="font-mono text-sm text-[#00D4FF]">{result.vin}</span>
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
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-64 bg-[#1E2530] rounded-xl flex items-center justify-center">
                      <Car size={64} className="text-gray-600" />
                    </div>
                  )}
                  
                  {/* Image count */}
                  {result.vehicle.images?.length > 1 && (
                    <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
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
                      <h2 className="text-2xl font-bold text-white">
                        {result.vehicle.title || `${result.vehicle.year || ''} ${result.vehicle.make || ''} ${result.vehicle.vehicleModel || result.vehicle.model || ''}`}
                      </h2>
                      <p className="text-gray-400 font-mono text-sm mt-1">
                        VIN: {result.vehicle.vin}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[#00D4FF]">
                        {formatPrice(result.vehicle.price)}
                      </p>
                      {result.vehicle.score && (
                        <p className="text-sm text-gray-400">
                          Якість даних: {Math.round(result.vehicle.score * 100)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#1E2530] rounded-xl">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Рік</p>
                      <p className="text-white font-semibold">{result.vehicle.year || 'Н/Д'}</p>
                    </div>
                    <div className="p-4 bg-[#1E2530] rounded-xl">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Пробіг</p>
                      <p className="text-white font-semibold">
                        {result.vehicle.mileage ? `${result.vehicle.mileage.toLocaleString()} ${result.vehicle.mileageUnit || 'mi'}` : 'Н/Д'}
                      </p>
                    </div>
                    <div className="p-4 bg-[#1E2530] rounded-xl">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Пошкодження</p>
                      <p className="text-white font-semibold capitalize">
                        {result.vehicle.damageType || result.vehicle.damageDescription || 'Н/Д'}
                      </p>
                    </div>
                    <div className="p-4 bg-[#1E2530] rounded-xl flex items-start gap-2">
                      <Calendar size={20} className="text-[#00D4FF] mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Дата аукціону</p>
                        <p className="text-white font-semibold">
                          {formatDate(result.vehicle.auctionDate || result.vehicle.saleDate)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-[#1E2530] rounded-xl flex items-start gap-2">
                      <MapPin size={20} className="text-[#00D4FF] mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Локація</p>
                        <p className="text-white font-semibold">
                          {result.vehicle.auctionLocation || result.vehicle.location || 'Н/Д'}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-[#1E2530] rounded-xl flex items-start gap-2">
                      <Tag size={20} className="text-[#00D4FF] mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Lot #</p>
                        <p className="text-white font-semibold font-mono">
                          {result.vehicle.lotNumber || result.vehicle.externalId || 'Н/Д'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sources */}
                  {result.vehicle.sources && result.vehicle.sources.length > 0 && (
                    <div className="pt-4 border-t border-[#2D3748]">
                      <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Джерела даних</p>
                      <div className="flex flex-wrap gap-2">
                        {result.vehicle.sources.map((src, idx) => (
                          <span key={idx} className="px-3 py-1 bg-[#1E2530] rounded-full text-sm text-gray-300 capitalize">
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
                      className="inline-flex items-center gap-2 text-[#00D4FF] hover:underline text-sm"
                    >
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
              <Car size={64} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl text-white font-semibold mb-2">
                Інформацію не знайдено
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Система не знайшла інформацію про цей VIN код. Спробуйте інший VIN або зверніться до підтримки.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-[#151A23] border border-[#2D3748] rounded-xl">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" />
            Database Search
          </h3>
          <p className="text-gray-400 text-sm">
            Спочатку шукаємо в нашій базі даних з 5+ авто
          </p>
        </div>
        <div className="p-4 bg-[#151A23] border border-[#2D3748] rounded-xl">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <MagnifyingGlass size={20} className="text-[#00D4FF]" />
            Web Intelligence
          </h3>
          <p className="text-gray-400 text-sm">
            Якщо не в базі - шукаємо через 20+ джерел онлайн
          </p>
        </div>
        <div className="p-4 bg-[#151A23] border border-[#2D3748] rounded-xl">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Tag size={20} className="text-yellow-500" />
            Smart Caching
          </h3>
          <p className="text-gray-400 text-sm">
            Результати кешуються на 7 днів для швидкості
          </p>
        </div>
      </div>
    </div>
  );
};

export default VinSearch;
