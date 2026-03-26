import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { motion } from 'framer-motion';

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'archived'];
const LEAD_SOURCES = ['website', 'referral', 'social_media', 'cold_call', 'advertisement', 'partner', 'other'];

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', source: 'website', description: '', value: 0
  });

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, sourceFilter]);

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      
      const res = await axios.get(`${API_URL}/api/leads?${params}`);
      setLeads(res.data.data || []);
    } catch (err) {
      toast.error('Помилка завантаження лідів');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await axios.put(`${API_URL}/api/leads/${editingLead.id}`, formData);
        toast.success('Лід оновлено');
      } else {
        await axios.post(`${API_URL}/api/leads`, formData);
        toast.success('Лід створено');
      }
      setShowModal(false);
      resetForm();
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити цей лід?')) return;
    try {
      await axios.delete(`${API_URL}/api/leads/${id}`);
      toast.success('Лід видалено');
      fetchLeads();
    } catch (err) {
      toast.error('Помилка видалення');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/api/leads/${id}`, { status: newStatus });
      toast.success('Статус оновлено');
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Неможливо змінити статус');
    }
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setFormData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source,
      description: lead.description || '',
      value: lead.value || 0
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingLead(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', source: 'website', description: '', value: 0 });
  };

  const statusLabels = {
    new: 'Новий', contacted: 'Контакт', qualified: 'Кваліфік.', proposal: 'Пропозиція',
    negotiation: 'Переговори', won: 'Виграно', lost: 'Програно', archived: 'Архів'
  };

  const sourceLabels = {
    website: 'Сайт', referral: 'Реферал', social_media: 'Соцмережі', cold_call: 'Холодний дзвінок',
    advertisement: 'Реклама', partner: 'Партнер', other: 'Інше'
  };

  return (
    <motion.div 
      data-testid="leads-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
            Ліди
          </h1>
          <p className="text-sm text-[#71717A] mt-1">Управління потенційними клієнтами</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary"
          data-testid="create-lead-btn"
        >
          <Plus size={18} weight="bold" />
          Новий лід
        </button>
      </div>

      {/* Filters */}
      <div className="card p-5 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук по імені, email, телефону..."
              className="input w-full"
              data-testid="leads-search-input"
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px] h-[46px] bg-white border border-[#E4E4E7] rounded-xl" data-testid="leads-status-filter">
              <SelectValue placeholder="Всі статуси" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі статуси</SelectItem>
              {LEAD_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter || "all"} onValueChange={(v) => setSourceFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px] h-[46px] bg-white border border-[#E4E4E7] rounded-xl" data-testid="leads-source-filter">
              <SelectValue placeholder="Всі джерела" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі джерела</SelectItem>
              {LEAD_SOURCES.map(s => (
                <SelectItem key={s} value={s}>{sourceLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="table-premium" data-testid="leads-table">
          <thead>
            <tr>
              <th>Ім'я</th>
              <th>Email</th>
              <th>Компанія</th>
              <th>Джерело</th>
              <th>Статус</th>
              <th>Вартість</th>
              <th className="text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-[#71717A]">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin"></div>
                  Завантаження...
                </div>
              </td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-[#71717A]">Немає лідів</td></tr>
            ) : leads.map(lead => (
              <tr key={lead.id} data-testid={`lead-row-${lead.id}`}>
                <td className="font-medium text-[#18181B]">{lead.firstName} {lead.lastName}</td>
                <td>{lead.email}</td>
                <td>{lead.company || '—'}</td>
                <td><span className="text-xs text-[#71717A]">{sourceLabels[lead.source]}</span></td>
                <td>
                  <Select value={lead.status} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                    <SelectTrigger className="w-[130px] h-8 bg-transparent border-0 p-0" data-testid={`lead-status-${lead.id}`}>
                      <span className={`badge status-${lead.status}`}>{statusLabels[lead.status]}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="text-[#059669] font-medium">${lead.value?.toLocaleString() || 0}</td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => openEditModal(lead)} 
                      className="p-2.5 hover:bg-[#F4F4F5] rounded-lg transition-colors" 
                      data-testid={`edit-lead-${lead.id}`}
                    >
                      <Pencil size={16} className="text-[#71717A]" />
                    </button>
                    <button 
                      onClick={() => handleDelete(lead.id)} 
                      className="p-2.5 hover:bg-[#FEE2E2] rounded-lg transition-colors" 
                      data-testid={`delete-lead-${lead.id}`}
                    >
                      <Trash size={16} className="text-[#DC2626]" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl border border-[#E4E4E7]" data-testid="lead-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              {editingLead ? 'Редагувати лід' : 'Новий лід'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Ім'я</label>
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required className="input w-full" data-testid="lead-firstname-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Прізвище</label>
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required className="input w-full" data-testid="lead-lastname-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="input w-full" data-testid="lead-email-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Телефон</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input w-full" data-testid="lead-phone-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Компанія</label>
                <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="input w-full" data-testid="lead-company-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Джерело</label>
                <Select value={formData.source} onValueChange={(v) => setFormData({...formData, source: v})}>
                  <SelectTrigger className="input w-full" data-testid="lead-source-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(s => (
                      <SelectItem key={s} value={s}>{sourceLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Вартість ($)</label>
                <input type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: parseInt(e.target.value) || 0})} className="input w-full" data-testid="lead-value-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Опис</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="input w-full resize-none" data-testid="lead-description-input" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1" data-testid="lead-cancel-btn">Скасувати</button>
              <button type="submit" className="btn-primary flex-1" data-testid="lead-submit-btn">{editingLead ? 'Зберегти' : 'Створити'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Leads;
