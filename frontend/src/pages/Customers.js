import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { motion } from 'framer-motion';

const CUSTOMER_TYPES = ['individual', 'company'];

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', type: 'individual', address: '', city: '', country: ''
  });

  useEffect(() => { fetchCustomers(); }, [search]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await axios.get(`${API_URL}/api/customers?${params}`);
      setCustomers(res.data.data || []);
    } catch (err) { toast.error('Помилка завантаження клієнтів'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await axios.put(`${API_URL}/api/customers/${editingCustomer.id}`, formData);
        toast.success('Клієнта оновлено');
      } else {
        await axios.post(`${API_URL}/api/customers`, formData);
        toast.success('Клієнта створено');
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Помилка'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити клієнта?')) return;
    try {
      await axios.delete(`${API_URL}/api/customers/${id}`);
      toast.success('Клієнта видалено');
      fetchCustomers();
    } catch (err) { toast.error('Помилка видалення'); }
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName, lastName: customer.lastName, email: customer.email,
      phone: customer.phone || '', company: customer.company || '', type: customer.type,
      address: customer.address || '', city: customer.city || '', country: customer.country || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', type: 'individual', address: '', city: '', country: '' });
  };

  const typeLabels = { individual: 'Фізична особа', company: 'Компанія' };

  return (
    <motion.div data-testid="customers-page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Клієнти</h1>
          <p className="text-sm text-[#71717A] mt-1">База клієнтів</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary" data-testid="create-customer-btn">
          <Plus size={18} weight="bold" />Новий клієнт
        </button>
      </div>

      <div className="card p-5 mb-5">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук клієнтів..." className="input max-w-md" data-testid="customers-search-input" />
      </div>

      <div className="card overflow-hidden">
        <table className="table-premium" data-testid="customers-table">
          <thead>
            <tr><th>Ім'я</th><th>Email</th><th>Телефон</th><th>Тип</th><th>Компанія</th><th>Угоди</th><th className="text-right">Дії</th></tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={7} className="text-center py-12 text-[#71717A]">Завантаження...</td></tr>
            ) : customers.length === 0 ? (<tr><td colSpan={7} className="text-center py-12 text-[#71717A]">Немає клієнтів</td></tr>
            ) : customers.map(customer => (
              <tr key={customer.id} data-testid={`customer-row-${customer.id}`}>
                <td className="font-medium text-[#18181B]">{customer.firstName} {customer.lastName}</td>
                <td>{customer.email}</td>
                <td>{customer.phone || '—'}</td>
                <td><span className="text-xs text-[#71717A]">{typeLabels[customer.type]}</span></td>
                <td>{customer.company || '—'}</td>
                <td>
                  <span className="font-semibold text-[#18181B]">{customer.totalDeals || 0}</span>
                  <span className="text-xs text-[#71717A] ml-1">(${customer.totalValue?.toLocaleString() || 0})</span>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEditModal(customer)} className="p-2.5 hover:bg-[#F4F4F5] rounded-lg" data-testid={`edit-customer-${customer.id}`}><Pencil size={16} className="text-[#71717A]" /></button>
                    <button onClick={() => handleDelete(customer.id)} className="p-2.5 hover:bg-[#FEE2E2] rounded-lg" data-testid={`delete-customer-${customer.id}`}><Trash size={16} className="text-[#DC2626]" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl border border-[#E4E4E7]" data-testid="customer-modal">
          <DialogHeader><DialogTitle className="text-xl font-bold text-[#18181B]" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>{editingCustomer ? 'Редагувати клієнта' : 'Новий клієнт'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Ім'я</label>
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required className="input w-full" data-testid="customer-firstname-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Прізвище</label>
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required className="input w-full" data-testid="customer-lastname-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="input w-full" data-testid="customer-email-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Телефон</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input w-full" data-testid="customer-phone-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Тип</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="input" data-testid="customer-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{CUSTOMER_TYPES.map(t => (<SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#71717A] mb-2">Компанія</label>
              <input type="text" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="input w-full" data-testid="customer-company-input" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1" data-testid="customer-cancel-btn">Скасувати</button>
              <button type="submit" className="btn-primary flex-1" data-testid="customer-submit-btn">{editingCustomer ? 'Зберегти' : 'Створити'}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Customers;
