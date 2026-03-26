# CRM/Admin Platform - PRD

## Оригінальна постановка задачі
Full CRM/Admin platform для автобізнесу з call-center операціями, automation workflows, communication management. Provider-based architecture для SMS з прицілом на Болгарію. Webhook delivery tracking та event-driven architecture.

## Зафіксований стек
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: React + Tailwind CSS
- **Cache/Queues**: Redis + Bull (6 черг)
- **SMS**: Provider abstraction layer (Twilio + Viber placeholder)
- **File Storage**: Local + S3 abstraction
- **Webhooks**: Twilio delivery status callbacks
- **Архітектура**: Event-driven, modular monolith
- **Мова інтерфейсу**: Українська (адмін), UK/EN/BG (шаблони)

## Реалізовано (Jan 2026 - Mar 2026)

### ✅ Core CRM
- Leads management (CRUD, status pipeline)
- Customers management
- Deals management
- Deposits management
- Tasks & Reminders

### ✅ Webhook & Delivery Tracking System
- POST /api/webhooks/twilio/status - Twilio SMS delivery callbacks
- Message Schema з full delivery tracking
- Timeline Events для всіх типів комунікацій

### ✅ Lead Contact Tracking
- callAttempts, smsAttempts, emailAttempts
- escalationLevel: 0-4
- lastContactAt, nextFollowUpAt

### ✅ Automation Engine (9+ rules)
- No-Answer Workflow (1st-4th attempts)
- Event-Driven Actions
- SMS/Email auto-send triggers

### ✅ Lead Routing Module v1 (Mar 2026)
- **Routing Strategies**: least_loaded, round_robin, fallback, manual
- **4 default rules**: Default-LeastLoaded, Bulgaria Market, Phone-RoundRobin, VIP Leads
- **Assignment History** - повний аудит призначень
- **Workload Matrix** - score = activeLeads*2 + openTasks + overdueTasks*3
- **SLA Tracking** - firstResponseDueAt
- **Automation Integration** - ASSIGN_MANAGER action

### ✅ Files & Documents Module (Mar 2026)
- Files API: upload, download, signed URLs
- Documents API: create, verify, reject, archive
- Storage Providers: Local + S3 abstraction
- Access Control: Admin/Manager/Finance

### ✅ Master Dashboard v2 (Mar 2026 - NEW)

**Architecture - Control Layer:**
```
modules/
  dashboard/
    controllers/dashboard.controller.ts
    services/
      dashboard.service.ts          # Orchestrator
      sla-dashboard.service.ts      # SLA metrics
      workload-dashboard.service.ts # Manager workload
      leads-dashboard.service.ts    # Lead flow
      callbacks-dashboard.service.ts # Call center
      deposits-dashboard.service.ts # Financial
      documents-dashboard.service.ts # Documents
      routing-dashboard.service.ts  # Routing health
      system-health-dashboard.service.ts # System
    dto/dashboard-query.dto.ts
    interfaces/dashboard-response.interface.ts
    constants/dashboard-cache.constants.ts
```

**API:**
- GET /api/dashboard/master - Головний агрегований endpoint
- GET /api/dashboard/master?period=day|week|month - Фільтрація по періоду
- GET /api/dashboard/kpi-summary - Короткий огляд KPI

**Dashboard Sections:**
1. **SLA Control** - overdueLeads, overdueTasks, overdueCallbacks, avgFirstResponseMinutes, missedSlaRate
2. **Workload Heatmap** - Manager workload scores, status (ok/busy/overloaded/idle)
3. **Lead Flow** - new, inProgress, converted, lost, unassigned
4. **Callback Control** - missedCalls, noAnswerLeads, followUpsDue, smsTriggered
5. **Deposits Control** - pendingDeposits, depositsWithoutProof, pendingVerification
6. **Documents Control** - pendingVerification, rejectedCount, uploadedToday
7. **Routing Health** - fallbackAssignments, reassignmentRate, unassignedLeads
8. **System Health** - failedJobs, queueBacklog, smsFailures, systemStatus

**Features:**
- Redis caching (30 sec TTL)
- Period filtering (day/week/month)
- Real-time workload calculation
- Critical alerts detection
- System health monitoring

**UI Components:**
- KPI Summary Row (6 critical metrics)
- Period Selector
- Critical Alerts Banner
- Workload Heatmap with status indicators
- 6 data sections with metrics

## Test Results (Mar 2026)
- Backend Lead Routing: 100%
- Backend Files/Documents: 100%
- Backend Master Dashboard v2: 100%
- Frontend Master Dashboard UI: 95%
- Integration tests: 100%

## Backlog

### P0 - Critical
- [x] ~~Master Dashboard v2 - Control Layer~~ ✅ DONE
- [ ] Configure Twilio credentials
- [ ] Configure S3 for production

### P1 - High Priority
- [ ] UI: Document verification panel
- [ ] UI: File viewer/uploader components
- [ ] Deposit integration (auto-create deposit_proof document)
- [ ] SLA overdue auto-reassignment cron job

### P2 - Medium Priority
- [ ] Reviews module (Google reviews, site reviews)
- [ ] Client Cabinet (client sees own documents)
- [ ] Viber Business integration
- [ ] Rate limiting for SMS

### P3 - Nice to Have
- [ ] AI Lead Scoring
- [ ] Document OCR
- [ ] WhatsApp Business integration
- [ ] E-signature integration

## Дата останнього оновлення
2026-03-26

## Наступні дії
1. **Deposit Auto-Flow** - автоматичне створення deposit_proof при завантаженні
2. UI components для файлів та документів
3. Cron jobs для SLA monitoring
4. Reviews module
