import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { Plus, MagnifyingGlass, Pencil, Trash } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const DEAL_STATUSES = ['draft', 'pending', 'in_progress', 'awaiting_payment', 'paid', 'completed', 'cancelled'];

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    title: '', customerId: '', value: 0, commission: 0, description: '', vehiclePlaceholder: ''
  });

  useEffect(() => {
    fetchDeals();
    fetchCustomers();
  }, [search, statusFilter]);

  const fetchDeals = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await axios.get(`${API_URL}/api/deals?${params}`);
      setDeals(res.data.data || []);
    } catch (err) {
      toast.error('Помилка завантаження угод');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/customers?limit=100`);
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити угоду?')) return;
    try {
      await axios.delete(`${API_URL}/api/deals/${id}`);
      toast.success('Угоду видалено');
      fetchDeals();
    } catch (err) {
      toast.error('Помилка видалення');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/deals/${id}`, { status: newStatus });
      toast.success('Статус оновлено');
      fetchDeals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Неможливо змінити статус');
    }
  };

  const openEditModal = (deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      customerId: deal.customerId,
      value: deal.value || 0,
      commission: deal.commission || 0,
      description: deal.description || '',
      vehiclePlaceholder: deal.vehiclePlaceholder || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingDeal(null);
    setFormData({ title: '', customerId: '', value: 0, commission: 0, description: '', vehiclePlaceholder: '' });
  };

  const statusLabels = {
    draft: 'Чернетка', pending: 'Очікує', in_progress: 'В роботі', awaiting_payment: 'Оплата',
    paid: 'Сплачено', completed: 'Завершено', cancelled: 'Скасовано'
  };

  const getCustomerName = (id) => {
    const c = customers.find(c => c.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '—';
  };

  return (
    <div data-testid="deals-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Угоди</h1>
          <p className="text-sm text-[#71717A] mt-1">Управління продажами</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2" data-testid="create-deal-btn">
          <Plus size={18} weight="bold" />Нова угода
        </button>
      </div>

      <div className="bg-white border border-[#D4D4D8] p-4 mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук угод..." className="w-full pl-10 pr-4 py-2 border border-[#D4D4D8] text-sm focus:outline-none focus:border-[#0055FF]" data-testid="deals-search-input" />
            </div>
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]" data-testid="deals-status-filter"><SelectValue placeholder="Всі статуси" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі статуси</SelectItem>
              {DEAL_STATUSES.map(s => (<SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white border border-[#D4D4D8] overflow-hidden">
        <table className="crm-table" data-testid="deals-table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Клієнт</th>
              <th>Статус</th>
              <th>Вартість</th>
              <th>Комісія</th>
              <th className="text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-[#71717A]">Завантаження...</td></tr>
            ) : deals.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-[#71717A]">Немає угод</td></tr>
            ) : deals.map(deal => (
              <tr key={deal.id} data-testid={`deal-row-${deal.id}`}>
                <td className="font-medium">{deal.title}</td>
                <td>{getCustomerName(deal.customerId)}</td>
                <td>
                  <Select value={deal.status} onValueChange={(v) => handleStatusChange(deal.id, v)}>
                    <SelectTrigger className="w-[130px] h-7 text-xs" data-testid={`deal-status-${deal.id}`}>
                      <span className="text-xs font-medium">{statusLabels[deal.status]}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_STATUSES.map(s => (<SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="font-semibold">${deal.value?.toLocaleString()}</td>
                <td>${deal.commission?.toLocaleString()}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEditModal(deal)} className="p-2 hover:bg-[#F4F4F5]" data-testid={`edit-deal-${deal.id}`}><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(deal.id)} className="p-2 hover:bg-[#FEE2E2] text-[#DC2626]" data-testid={`delete-deal-${deal.id}`}><Trash size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md" data-testid="deal-modal">
          <DialogHeader><DialogTitle>{editingDeal ? 'Редагувати угоду' : 'Нова угода'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Назва угоди</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border border-[#D4D4D8] text-sm" data-testid="deal-title-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Клієнт</label>
              <Select value={formData.customerId} onValueChange={(v) => setFormData({...formData, customerId: v})}>
                <SelectTrigger data-testid="deal-customer-select"><SelectValue placeholder="Оберіть клієнта" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Вартість ($)</label>
                <input type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-[#D4D4D8] text-sm" data-testid="deal-value-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Комісія ($)</label>
                <input type="number" value={formData.commission} onChange={(e) => setFormData({...formData, commission: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-[#D4D4D8] text-sm" data-testid="deal-commission-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Авто (placeholder)</label>
              <input type="text" value={formData.vehiclePlaceholder} onChange={(e) => setFormData({...formData, vehiclePlaceholder: e.target.value})} placeholder="BMW X5 2022" className="w-full px-3 py-2 border border-[#D4D4D8] text-sm" data-testid="deal-vehicle-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Опис</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-[#D4D4D8] text-sm resize-none" data-testid="deal-description-input" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary" data-testid="deal-cancel-btn">Скасувати</button>
              <button type="submit" className="flex-1 btn-primary" data-testid="deal-submit-btn">{editingDeal ? 'Зберегти' : 'Створити'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Deals;
