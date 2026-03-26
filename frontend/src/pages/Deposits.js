import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { Plus, Check, MagnifyingGlass } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const DEPOSIT_STATUSES = ['pending', 'confirmed', 'processing', 'completed', 'refunded', 'failed'];

const Deposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ customerId: '', amount: 0, description: '' });

  useEffect(() => { fetchDeposits(); fetchCustomers(); }, [statusFilter]);

  const fetchDeposits = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await axios.get(`${API_URL}/api/deposits?${params}`);
      setDeposits(res.data.data || []);
    } catch (err) { toast.error('Помилка'); } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try { const res = await axios.get(`${API_URL}/api/customers?limit=100`); setCustomers(res.data.data || []); } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/deposits`, formData);
      toast.success('Депозит створено');
      setShowModal(false);
      setFormData({ customerId: '', amount: 0, description: '' });
      fetchDeposits();
    } catch (err) { toast.error('Помилка'); }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API_URL}/api/deposits/${id}/approve`);
      toast.success('Депозит підтверджено');
      fetchDeposits();
    } catch (err) { toast.error('Помилка підтвердження'); }
  };

  const statusLabels = { pending: 'Очікує', confirmed: 'Підтверджено', processing: 'Обробка', completed: 'Завершено', refunded: 'Повернуто', failed: 'Невдача' };
  const getCustomerName = (id) => { const c = customers.find(c => c.id === id); return c ? `${c.firstName} ${c.lastName}` : '—'; };

  return (
    <div data-testid="deposits-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Депозити</h1>
          <p className="text-sm text-[#71717A] mt-1">Управління депозитами</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2" data-testid="create-deposit-btn">
          <Plus size={18} weight="bold" />Новий депозит
        </button>
      </div>

      <div className="bg-white border border-[#D4D4D8] p-4 mb-4">
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]" data-testid="deposits-status-filter"><SelectValue placeholder="Всі статуси" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі статуси</SelectItem>
            {DEPOSIT_STATUSES.map(s => (<SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-[#D4D4D8] overflow-hidden">
        <table className="crm-table" data-testid="deposits-table">
          <thead><tr><th>Клієнт</th><th>Сума</th><th>Статус</th><th>Опис</th><th>Дата</th><th className="text-right">Дії</th></tr></thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="text-center py-8 text-[#71717A]">Завантаження...</td></tr>
            ) : deposits.length === 0 ? (<tr><td colSpan={6} className="text-center py-8 text-[#71717A]">Немає депозитів</td></tr>
            ) : deposits.map(d => (
              <tr key={d.id} data-testid={`deposit-row-${d.id}`}>
                <td className="font-medium">{getCustomerName(d.customerId)}</td>
                <td className="font-semibold">${d.amount?.toLocaleString()}</td>
                <td><span className={`status-badge ${d.status === 'completed' ? 'status-won' : d.status === 'pending' ? 'status-new' : 'status-contacted'}`}>{statusLabels[d.status]}</span></td>
                <td className="text-sm text-[#71717A]">{d.description || '—'}</td>
                <td className="text-sm text-[#71717A]">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('uk-UA') : '—'}</td>
                <td>
                  {d.status === 'pending' && (
                    <button onClick={() => handleApprove(d.id)} className="p-2 hover:bg-[#D1FAE5] text-[#16A34A]" data-testid={`approve-deposit-${d.id}`}><Check size={18} weight="bold" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md" data-testid="deposit-modal">
          <DialogHeader><DialogTitle>Новий депозит</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Клієнт</label>
              <Select value={formData.customerId} onValueChange={(v) => setFormData({...formData, customerId: v})}>
                <SelectTrigger data-testid="deposit-customer-select"><SelectValue placeholder="Оберіть клієнта" /></SelectTrigger>
                <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Сума ($)</label>
              <input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})} required className="w-full px-3 py-2 border border-[#D4D4D8] text-sm" data-testid="deposit-amount-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Опис</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-[#D4D4D8] text-sm resize-none" data-testid="deposit-description-input" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Скасувати</button>
              <button type="submit" className="flex-1 btn-primary" data-testid="deposit-submit-btn">Створити</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Deposits;
