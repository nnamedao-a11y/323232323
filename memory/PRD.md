# CRM/Admin Platform - PRD

## Оригінальна постановка задачі
Full CRM/Admin platform для автобізнесу з call-center операціями, automation workflows, communication management. Provider-based architecture для SMS з прицілом на Болгарію. Webhook delivery tracking та event-driven architecture.

## Зафіксований стек
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: React + Tailwind CSS + Framer Motion
- **UI/UX**: Premium Dark Theme (fomo.cx inspired)
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

### ✅ Master Dashboard v2 (Mar 2026)

**Architecture - Control Layer:**
- 8 specialized dashboard services
- Aggregated endpoint GET /api/dashboard/master
- Redis caching (30 sec TTL)
- Period filtering (day/week/month)

**Dashboard Sections:**
1. SLA Control - overdueLeads, overdueTasks, avgFirstResponseMinutes
2. Workload Heatmap - Manager workload scores, status
3. Lead Flow - new, inProgress, converted, lost
4. Callback Control - missedCalls, noAnswerLeads, followUpsDue
5. Deposits Control - pendingDeposits, depositsWithoutProof
6. Documents Control - pendingVerification, rejectedCount
7. Routing Health - fallbackAssignments, reassignmentRate
8. System Health - failedJobs, queueBacklog, systemStatus

### ✅ Premium Dark Theme UI/UX (Mar 2026 - NEW)

**Design System:**
- **Color Palette**: 
  - Background: #0A0B0F
  - Surface: #13151A
  - Primary: #4F46E5 (Indigo)
  - Text: #F8FAFC / #94A3B8 / #64748B
  - Accents: Emerald, Amber, Red, Violet
  
- **Typography**:
  - Headings: Outfit (medium weight)
  - Body: Plus Jakarta Sans
  
- **Components**:
  - Cards: rounded-2xl, soft borders (border-white/5), glow effects
  - Buttons: rounded-xl, gradient backgrounds, hover shadows
  - Inputs: rounded-xl, transparent backgrounds, focus rings
  - Dropdowns: backdrop blur, soft shadows
  - Tables: no vertical dividers, horizontal borders white/5
  - Badges: pill-shaped with colored backgrounds
  
- **Motion**:
  - Framer Motion for page transitions
  - Staggered children animations
  - Hover scale/translate effects
  - Smooth 300ms transitions

**Implemented Pages:**
- Login (gradient background, premium card)
- Dashboard (KPI cards with glow, all 8 sections)
- Leads (premium table, filters, create/edit modal)
- Layout (sidebar with active states)

## Test Results (Mar 2026)
- Backend Master Dashboard v2: 100%
- Frontend Premium UI: 100%
- UI Theme: 100%
- Functionality: 100%

## Backlog

### P0 - Critical
- [x] ~~Master Dashboard v2~~ ✅ DONE
- [x] ~~Premium Dark Theme UI~~ ✅ DONE
- [ ] Configure Twilio credentials
- [ ] Configure S3 for production

### P1 - High Priority
- [ ] UI: Document verification panel
- [ ] UI: File viewer/uploader components
- [ ] Update remaining pages (Customers, Deals, Deposits, Tasks, Staff, Settings)
- [ ] Deposit integration (auto-create deposit_proof document)

### P2 - Medium Priority
- [ ] Reviews module (Google reviews, site reviews)
- [ ] Client Cabinet (client sees own documents)
- [ ] WebSocket real-time dashboard updates
- [ ] Viber Business integration

### P3 - Nice to Have
- [ ] AI Lead Scoring
- [ ] Document OCR
- [ ] WhatsApp Business integration
- [ ] E-signature integration

## Дата останнього оновлення
2026-03-26

## Наступні дії
1. Оновити UI для інших сторінок (Customers, Deals, Deposits, Tasks, Staff, Settings)
2. UI components для файлів та документів
3. WebSocket для real-time оновлень dashboard
4. Reviews module
