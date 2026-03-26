# CRM/Admin Platform - PRD

## Оригінальна постановка задачі
Full CRM/Admin platform для автобізнесу без публічного сайту та парсера. Модульна, domain-driven архітектура з TypeScript.

## Зафіксований стек
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: React + TypeScript
- **Cache/Queues**: Redis (підготовлено, не інтегровано)
- **Архітектура**: Modular monolith, domain-driven

## Реалізовано (Phase 1-3)

### Backend Modules
- ✅ Auth (JWT, login/logout, password hashing)
- ✅ Users (CRUD, roles, soft-delete)
- ✅ Roles & Permissions (matrix: master_admin, admin, moderator, manager, finance)
- ✅ Leads (pipeline: new→contacted→qualified→proposal→negotiation→won/lost, source tracking)
- ✅ Customers (individual/company, linked deals)
- ✅ Deals (pipeline: draft→pending→in_progress→awaiting_payment→paid→completed)
- ✅ Deposits (lifecycle: pending→confirmed→processing→completed, approval workflow)
- ✅ Tasks (priorities, due dates, statuses)
- ✅ Notes (entity-linked)
- ✅ Tags
- ✅ Notifications (in-app)
- ✅ Dashboard & KPI
- ✅ Staff
- ✅ Settings
- ✅ Audit Log

### Frontend Pages (Ukrainian UI)
- ✅ Login
- ✅ Dashboard (KPI cards, stats)
- ✅ Leads (table, filters, CRUD modal, status change)
- ✅ Customers (table, CRUD modal)
- ✅ Deals (table, status management)
- ✅ Deposits (table, approve action)
- ✅ Tasks (cards, priority, status)
- ✅ Staff (team list)
- ✅ Settings (system config)

## User Personas
1. **Master Admin** - повний доступ до всіх функцій
2. **Admin** - управління користувачами, лідами, угодами
3. **Moderator** - робота з лідами, призначення
4. **Manager** - власні ліди, клієнти, завдання
5. **Finance** - депозити, фінансові звіти

## API Endpoints
- POST /api/auth/login
- GET /api/auth/me
- CRUD /api/leads, /api/customers, /api/deals, /api/deposits, /api/tasks
- GET /api/dashboard, /api/dashboard/kpi
- GET /api/staff, /api/settings, /api/audit-logs
- GET/PUT /api/notifications

## Що залишилося (P1)
- [ ] Redis integration для queue jobs
- [ ] Email notifications (Resend integration ready)
- [ ] Object Storage для файлів
- [ ] AI classification module
- [ ] 2FA via email
- [ ] Documents module
- [ ] Reminders automation
- [ ] Activity timeline
- [ ] Export (Excel/CSV)
- [ ] Client cabinet API

## Технічний борг
- Supervisor конфіг для NestJS (зараз запускається через ts-node)
- Redis connection
- File upload abstraction

## Дата реалізації
2026-03-26

## Наступні дії
1. Інтеграція Redis для queues
2. Email notifications
3. Object Storage для документів
4. Automation rules engine
