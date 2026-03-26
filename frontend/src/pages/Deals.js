import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { motion } from 'framer-motion';

const DEAL_STATUSES = ['draft', 'pending', 'in_progress', 'awaiting_payment', 'paid', 'completed', 'cancelled'];

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({ title: '', customerId: '', value: 0, commission: 0, description: '', vehiclePlaceholder: '' });

  useEffect(() => { fetchDeals(); fetchCustomers(); }, [search, statusFilter]);

  const fetchDeals = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await axios.get(`${API_URL}/api/deals?${params}`);
      setDeals(res.data.data || []);
    } catch (err) { toast.error('Помилка завантаження угод'); } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try { const res = await axios.get(`${API_URL}/api/customers?limit=100`); setCustomers(res.data.data || []); } catch (err) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDeal) {
        await axios.put(`${API_URL}/api/deals/${editingDeal.id}`, formData);
        toast.success('Угоду оновлено');
      } else {
        await axios.post(`${API_URL}/api/deals`, formData);
        toast.success('Угоду створено');
      }
      setShowModal(false);
      resetForm();
      fetchDeals();
    } catch (err) { toast.error(err.response?.data?.message || 'Помилка'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити угоду?')) return;
    try {
      await axios.delete(`${API_URL}/api/deals/${id}`);
      toast.success('Угоду видалено');
      fetchDeals();
    } catch (err) { toast.error('Помилка видалення'); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/deals/${id}`, { status: newStatus });
      toast.success('Статус оновлено');
      fetchDeals();
    } catch (err) { toast.error(err.response?.data?.message || 'Неможливо змінити статус'); }
  };

  const openEditModal = (deal) => {
    setEditingDeal(deal);
    setFormData({ title: deal.title, customerId: deal.customerId, value: deal.value || 0, commission: deal.commission || 0, description: deal.description || '', vehiclePlaceholder: deal.vehiclePlaceholder || '' });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingDeal(null);
    setFormData({ title: '', customerId: '', value: 0, commission: 0, description: '', vehiclePlaceholder: '' });
  };

  const statusLabels = { draft: 'Чернетка', pending: 'Очікує', in_progress: 'В роботі', awaiting_payment: 'Оплата', paid: 'Сплачено', completed: 'Завершено', cancelled: 'Скасовано' };
  const getCustomerName = (id) => { const c = customers.find(c => c.id === id); return c ? `${c.firstName} ${c.lastName}` : '—'; };

  return (
    <motion.div data-testid="deals-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Угоди</h1>
          <p className="text-sm text-[#71717A] mt-1">Управління продажами</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" data-testid="create-deal-btn">
          <Plus size={18} weight="bold" />Нова угода
        </button>
      </div>

      <div className="card p-5 mb-5">
        <div className="flex flex-wrap gap-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук угод..." className="input flex-1 min-w-[200px]" data-testid="deals-search-input" />
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px] input" data-testid="deals-status-filter"><SelectValue placeholder="Всі статуси" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі статуси</SelectItem>
              {DEAL_STATUSES.map(s => (<SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table-premium" data-testid="deals-table">
          <thead><tr><th>Назва</th><th>Клієнт</th><th>Статус</th><th>Вартість</th><th>Комісія</th><th className="text-right">Дії</th></tr></thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="text-center py-12 text-[#71717A]">Завантаження...</td></tr>
            ) : deals.length === 0 ? (<tr><td colSpan={6} className="text-center py-12 text-[#71717A]">Немає угод</td></tr>
            ) : deals.map(deal => (
              <tr key={deal.id} data-testid={`deal-row-${deal.id}`}>
                <td className="font-medium text-[#18181B]">{deal.title}</td>
                <td>{getCustomerName(deal.customerId)}</td>
                <td>
                  <Select value={deal.status} onValueChange={(v) => handleStatusChange(deal.id, v)}>
                    <SelectTrigger className="w-[130px] h-8 bg-transparent border-0 p-0" data-testid={`deal-status-${deal.id}`}>
                      <span className={`badge status-${deal.status === 'completed' ? 'won' : deal.status === 'cancelled' ? 'lost' : 'contacted'}`}>{statusLabels[deal.status]}</span>
                    </SelectTrigger>
                    <SelectContent>{DEAL_STATUSES.map(s => (<SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>))}</SelectContent>
                  </Select>
                </td>
                <td className="font-semibold text-[#059669]">${deal.value?.toLocaleString()}</td>
                <td className="text-[#71717A]">${deal.commission?.toLocaleString()}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEditModal(deal)} className="p-2.5 hover:bg-[#F4F4F5] rounded-lg" data-testid={`edit-deal-${deal.id}`}><Pencil size={16} className="text-[#71717A]" /></button>
                    <button onClick={() => handleDelete(deal.id)} className="p-2.5 hover:bg-[#FEE2E2] rounded-lg" data-testid={`delete-deal-${deal.id}`}><Trash size={16} className="text-[#DC2626]" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl border border-[#E4E4E7]" data-testid="deal-modal">
          <DialogHeader><DialogTitle className="text-xl font-bold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>{editingDeal ? 'Редагувати угоду' : 'Нова угода'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Назва угоди</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="input w-full" data-testid="deal-title-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Клієнт</label>
              <Select value={formData.customerId} onValueChange={(v) => setFormData({...formData, customerId: v})}>
                <SelectTrigger className="input" data-testid="deal-customer-select"><SelectValue placeholder="Оберіть клієнта" /></SelectTrigger>
                <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Вартість ($)</label>
                <input type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: parseInt(e.target.value) || 0})} className="input w-full" data-testid="deal-value-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Комісія ($)</label>
                <input type="number" value={formData.commission} onChange={(e) => setFormData({...formData, commission: parseInt(e.target.value) || 0})} className="input w-full" data-testid="deal-commission-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Авто</label>
              <input type="text" value={formData.vehiclePlaceholder} onChange={(e) => setFormData({...formData, vehiclePlaceholder: e.target.value})} placeholder="BMW X5 2022" className="input w-full" data-testid="deal-vehicle-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Опис</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="input w-full resize-none" data-testid="deal-description-input" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1" data-testid="deal-cancel-btn">Скасувати</button>
              <button type="submit" className="btn-primary flex-1" data-testid="deal-submit-btn">{editingDeal ? 'Зберегти' : 'Створити'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Deals;
