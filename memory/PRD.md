# CRM/Admin Platform - PRD

## Оригінальна постановка задачі
Full CRM/Admin platform для автобізнесу з call-center операціями, automation workflows, communication management. Provider-based architecture для SMS з прицілом на Болгарію.

## Зафіксований стек
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: React + Tailwind CSS
- **Cache/Queues**: Redis + Bull (6 черг)
- **SMS**: Provider abstraction layer (Twilio + Viber placeholder)
- **Архітектура**: Modular monolith, domain-driven
- **Мова інтерфейсу**: Українська (адмін), UK/EN/BG (шаблони)

## Реалізовано (Jan 2026)

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

### ✅ Automation Engine (9 rules)
**Lead Lifecycle:**
- Новий лід → callback task (10 хв) + notification

**No-Answer Workflow (Bulgaria-optimized):**
1. Перший no_answer → follow-up через 2 години
2. Другий no_answer → follow-up через 2 дні
3. Третій no_answer → **SMS автоматично** + follow-up через 3 дні
4. Четвертий no_answer → перевести в cold/unreachable

**Task Management:**
- Прострочена задача → ескалація адміну

**Deposit:**
- Депозит отримано → notification менеджеру

**No Response Monitoring:**
- 24h без відповіді → reminder + callback
- 48h без відповіді → ескалація

### ✅ Communication Module (Provider-Based)
**Architecture:**
```
communications/
├── providers/
│   ├── sms.provider.interface.ts  # Abstract contract
│   ├── twilio.provider.ts         # Twilio implementation
│   ├── viber.provider.ts          # Viber placeholder
│   └── sms-provider.manager.ts    # Fallback orchestration
├── schemas/
│   ├── communication-log.schema.ts
│   └── message-template.schema.ts (multilingual)
└── communications.service.ts
```

**SMS Providers:**
- ✅ TwilioSMSProvider (Bulgaria E.164: +359XXXXXXXXX)
- ✅ ViberBusinessProvider (placeholder для Phase 2)
- ✅ SMSProviderManager (fallback, country detection)

**Message Templates (7 total):**
Email (3): new_lead, task_reminder, deposit_alert
SMS (4): follow_up, no_answer, callback, welcome

**Multilingual Support:**
- UK: українська (default)
- EN: English
- BG: български (Bulgaria client communications)

### ✅ Export Module
- Excel export: leads, deals, deposits, tasks
- Audit log tracking

### Frontend Pages (Ukrainian UI)
- ✅ Login, Dashboard, Leads, Customers, Deals, Deposits, Tasks, Staff, Settings

## API Endpoints

### Communications (NEW)
- POST /api/communications/send - universal message send
- POST /api/communications/sms/send - direct SMS
- GET /api/communications/sms/providers - providers status
- GET /api/communications/history/:recipientId
- CRUD /api/communications/templates

### Automation
- CRUD /api/automation/rules
- GET /api/automation/logs

### Export
- GET /api/export/leads (Excel)
- GET /api/export/deals (Excel)
- GET /api/export/deposits (Excel)
- GET /api/export/tasks (Excel)

## Configuration Required

### Twilio SMS (Bulgaria)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+359XXXXXXXXX
# Optional:
TWILIO_MESSAGING_SERVICE_SID=your_service_sid
TWILIO_STATUS_CALLBACK_URL=https://your-domain/api/webhooks/twilio
```

### Resend Email
```env
RESEND_API_KEY=re_xxxxxxxx
SENDER_EMAIL=noreply@yourdomain.com
```

### Viber Business (Future)
```env
VIBER_BUSINESS_ID=your_business_id
VIBER_SERVICE_ID=your_service_id
VIBER_AUTH_TOKEN=your_auth_token
VIBER_SENDER_NAME=AutoCRM
```

## Backlog

### P0 - Critical
- [ ] Configure Twilio credentials for SMS
- [ ] Configure Resend for email

### P1 - High Priority
- [ ] Viber Business integration via partner
- [ ] File/Document storage (S3/local)
- [ ] Automation rules UI in admin panel
- [ ] Call Center UI components
- [ ] Communication timeline in lead card

### P2 - Medium Priority
- [ ] Delivery status webhooks
- [ ] Reviews module (Google Reviews integration)
- [ ] Activity timeline component
- [ ] 2FA via SMS/email

### P3 - Nice to Have
- [ ] AI Lead Scoring (після накопичення даних)
- [ ] WhatsApp Business integration
- [ ] Parser integration
- [ ] Client cabinet API

## Test Results (Jan 2026)
- Backend: 93.3% (14/15 tests)
- Frontend: 100%
- Integration: 100%

## Дата останнього оновлення
2026-03-26

## Наступні дії
1. Налаштувати TWILIO_* в .env для SMS
2. Налаштувати RESEND_API_KEY для email
3. Додати UI для Automation Rules
4. Почати Viber Business onboarding через партнера
