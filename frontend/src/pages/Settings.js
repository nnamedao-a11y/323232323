import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`);
      setSettings(res.data || []);
    } catch (err) { toast.error('Помилка завантаження налаштувань'); } finally { setLoading(false); }
  };

  const settingLabels = {
    lead_statuses: 'Статуси лідів',
    deal_statuses: 'Статуси угод',
    deposit_statuses: 'Статуси депозитів',
    lead_sources: 'Джерела лідів'
  };

  return (
    <div data-testid="settings-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Налаштування</h1>
        <p className="text-sm text-[#71717A] mt-1">Конфігурація системи</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#71717A]">Завантаження...</div>
      ) : (
        <div className="space-y-4">
          {settings.map(setting => (
            <div key={setting.id || setting.key} className="bg-white border border-[#D4D4D8] p-5" data-testid={`setting-${setting.key}`}>
              <h3 className="font-semibold mb-2" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                {settingLabels[setting.key] || setting.key}
              </h3>
              <p className="text-sm text-[#71717A] mb-3">{setting.description}</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(setting.value) ? setting.value.map((val, i) => (
                  <span key={i} className="px-3 py-1 bg-[#F4F4F5] text-sm">{val}</span>
                )) : (
                  <span className="text-sm">{JSON.stringify(setting.value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Settings;
