# CRM/Admin Platform - PRD

## Оригінальна постановка задачі
Full CRM/Admin platform для автобізнесу. Modular architecture з TypeScript для call-center операцій, automation workflows та communication management.

## Зафіксований стек
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: React + Tailwind CSS
- **Cache/Queues**: Redis + Bull (інтегровано)
- **Архітектура**: Modular monolith, domain-driven
- **Мова інтерфейсу**: Українська

## Реалізовано (Phase 1-4)

### Backend Modules
- ✅ Auth (JWT, login/logout, password hashing)
- ✅ Users (CRUD, roles, soft-delete)
- ✅ Roles & Permissions (matrix: master_admin, admin, moderator, manager, finance)
- ✅ Leads (pipeline + contact status, source tracking, automation triggers)
- ✅ Customers (individual/company, linked deals)
- ✅ Deals (pipeline: draft→pending→in_progress→awaiting_payment→paid→completed)
- ✅ Deposits (lifecycle with approval workflow)
- ✅ Tasks (priorities, due dates, statuses, reminders)
- ✅ Notes (entity-linked)
- ✅ Tags
- ✅ Notifications (in-app)
- ✅ Dashboard & KPI
- ✅ Staff
- ✅ Settings
- ✅ Audit Log
- ✅ **Redis Queue Infrastructure** (automation, notifications, callbacks, follow-ups, escalations, communications)
- ✅ **Automation Engine** (triggers: lead_created, lead_assigned, call_missed, task_overdue, deposit_received; actions: create_task, send_notification, escalate, schedule_callback, schedule_follow_up)
- ✅ **Call Center Module** (call logging, callback queue, contact status tracking, call history)
- ✅ **Communications Module** (email templates, message history, Resend integration ready)
- ✅ **Export Module** (Excel export for leads, deals, deposits, tasks)

### Frontend Pages (Ukrainian UI)
- ✅ Login
- ✅ Dashboard (KPI cards, stats by status)
- ✅ Leads (table, filters, CRUD modal, status change)
- ✅ Customers (table, CRUD modal)
- ✅ Deals (table, status management)
- ✅ Deposits (table, approve action)
- ✅ Tasks (cards, priority, status)
- ✅ Staff (team list)
- ✅ Settings (system config)

### Automation Rules (Default)
1. Новий лід → створити задачу на дзвінок (10 хв) + нотифікація менеджеру
2. Прострочена задача → ескалація адміну + нотифікація
3. Пропущений дзвінок → follow-up через 2 години
4. Депозит отримано → нотифікація менеджеру

### Communication Templates
1. Новий лід (Email)
2. Нагадування про задачу (Email)
3. Депозит отримано (Email)
4. Follow-up SMS

## User Personas
1. **Master Admin** - повний доступ до всіх функцій
2. **Admin** - управління користувачами, лідами, угодами, automation rules
3. **Moderator** - робота з лідами, призначення
4. **Manager** - власні ліди, клієнти, завдання
5. **Finance** - депозити, фінансові звіти, експорт

## API Endpoints
### Auth
- POST /api/auth/login
- GET /api/auth/me

### Core CRUD
- CRUD /api/leads, /api/customers, /api/deals, /api/deposits, /api/tasks

### Dashboard
- GET /api/dashboard
- GET /api/dashboard/kpi

### Automation
- CRUD /api/automation/rules
- GET /api/automation/logs

### Call Center
- POST /api/call-center/calls (log call)
- GET /api/call-center/calls/:leadId (history)
- POST /api/call-center/callbacks (schedule)
- GET /api/call-center/callbacks (queue)
- PUT /api/call-center/callbacks/:id/complete
- GET /api/call-center/stats

### Communications
- POST /api/communications/send
- GET /api/communications/history/:recipientId
- CRUD /api/communications/templates

### Export
- GET /api/export/leads (Excel)
- GET /api/export/deals (Excel)
- GET /api/export/deposits (Excel)
- GET /api/export/tasks (Excel)

## Що залишилося (Backlog)

### P0 - Critical
- [ ] Resend API key configuration для email нотифікацій
- [ ] SMS provider integration (Twilio/local provider for Bulgaria)

### P1 - High Priority
- [ ] File/Document storage (S3/local)
- [ ] Automation rules UI в адмін-панелі
- [ ] Call Center UI (логування дзвінків, callback queue)
- [ ] Communication timeline в картці ліда

### P2 - Medium Priority
- [ ] Viber Business integration
- [ ] Reviews module (Google Reviews integration)
- [ ] Activity timeline component
- [ ] 2FA via email

### P3 - Nice to Have
- [ ] AI Lead Scoring (після накопичення даних)
- [ ] Parser integration
- [ ] Client cabinet API

## Технічний стек
- Redis workers запущені через Bull queues
- Supervisor конфіг з Python proxy для NestJS
- Hot reload enabled
- MongoDB indexes optimized

## Дата останнього оновлення
2026-03-26

## Наступні дії
1. Налаштувати RESEND_API_KEY для email нотифікацій
2. Додати UI для Automation Rules
3. Додати Call Center UI компоненти
4. Інтегрувати File Storage для документів
