import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try { const res = await axios.get(`${API_URL}/api/settings`); setSettings(res.data || []); } catch (err) { toast.error('Помилка завантаження налаштувань'); } finally { setLoading(false); }
  };

  const settingLabels = {
    lead_statuses: 'Статуси лідів',
    deal_statuses: 'Статуси угод',
    deposit_statuses: 'Статуси депозитів',
    lead_sources: 'Джерела лідів'
  };

  return (
    <motion.div data-testid="settings-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Налаштування</h1>
        <p className="text-sm text-[#71717A] mt-1">Конфігурація системи</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#71717A]">Завантаження...</div>
      ) : (
        <div className="space-y-5">
          {settings.map(setting => (
            <div key={setting.id || setting.key} className="section-card" data-testid={`setting-${setting.key}`}>
              <h3 className="font-semibold text-[#18181B] mb-2" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
                {settingLabels[setting.key] || setting.key}
              </h3>
              <p className="text-sm text-[#71717A] mb-4">{setting.description}</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(setting.value) ? setting.value.map((val, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#F4F4F5] text-sm rounded-lg text-[#3F3F46]">{val}</span>
                )) : (
                  <span className="text-sm text-[#3F3F46]">{JSON.stringify(setting.value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Settings;
