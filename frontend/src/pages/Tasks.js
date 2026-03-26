import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { toast } from 'sonner';
import { Plus, Check, Clock, Warning } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const TASK_STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });

  useEffect(() => { fetchTasks(); }, [statusFilter]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await axios.get(`${API_URL}/api/tasks?${params}`);
      setTasks(res.data.data || []);
    } catch (err) { toast.error('Помилка'); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/tasks`, formData);
      toast.success('Завдання створено');
      setShowModal(false);
      setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
      fetchTasks();
    } catch (err) { toast.error('Помилка'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${API_URL}/api/tasks/${id}`, { status });
      toast.success('Статус оновлено');
      fetchTasks();
    } catch (err) { toast.error('Помилка'); }
  };

  const statusLabels = { todo: 'До виконання', in_progress: 'В роботі', completed: 'Виконано', cancelled: 'Скасовано' };
  const priorityLabels = { low: 'Низький', medium: 'Середній', high: 'Високий', urgent: 'Терміновий' };
  const priorityColors = { low: '#71717A', medium: '#2563EB', high: '#EAB308', urgent: '#DC2626' };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  return (
    <div data-testid="tasks-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>Завдання</h1>
          <p className="text-sm text-[#71717A] mt-1">Управління завданнями</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2" data-testid="create-task-btn">
          <Plus size={18} weight="bold" />Нове завдання
        </button>
      </div>

      <div className="bg-white border border-[#D4D4D8] p-4 mb-4">
        <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]" data-testid="tasks-status-filter"><SelectValue placeholder="Всі статуси" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі статуси</SelectItem>
            {TASK_STATUSES.map(s => (<SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {loading ? (<div className="text-center py-8 text-[#71717A]">Завантаження...</div>
        ) : tasks.length === 0 ? (<div className="text-center py-8 text-[#71717A]">Немає завдань</div>
        ) : tasks.map(task => (
          <div key={task.id} className={`bg-white border border-[#D4D4D8] p-4 ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'border-l-4 border-l-[#DC2626]' : ''}`} data-testid={`task-card-${task.id}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{task.title}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5" style={{ backgroundColor: `${priorityColors[task.priority]}20`, color: priorityColors[task.priority] }}>
                    {priorityLabels[task.priority]}
                  </span>
                </div>
                {task.description && <p className="text-sm text-[#71717A] mb-2">{task.description}</p>}
                <div className="flex items-center gap-4 text-xs text-[#71717A]">
                  {task.dueDate && (
                    <div className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-[#DC2626]' : ''}`}>
                      {isOverdue(task.dueDate) && task.status !== 'completed' ? <Warning size={14} /> : <Clock size={14} />}
                      {new Date(task.dueDate).toLocaleDateString('uk-UA')}
                    </div>
                  )}
                </div>
              </div>
              <Select value={task.status} onValueChange={(v) => handleStatusChange(task.id, v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs" data-testid={`task-status-${task.id}`}>
                  <span>{statusLabels[task.status]}</span>
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map(s => (<SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md" data-testid="task-modal">
          <DialogHeader><DialogTitle>Нове завдання</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Назва</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border border-[#D4D4D8] text-sm" data-testid="task-title-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Пріоритет</label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                  <SelectTrigger data-testid="task-priority-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_PRIORITIES.map(p => (<SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Дедлайн</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 border border-[#D4D4D8] text-sm" data-testid="task-duedate-input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-1">Опис</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-[#D4D4D8] text-sm resize-none" data-testid="task-description-input" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Скасувати</button>
              <button type="submit" className="flex-1 btn-primary" data-testid="task-submit-btn">Створити</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
