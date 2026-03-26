# CRM/Admin Platform - PRD

## Оригінальна постановка задачі
Full CRM/Admin platform для автобізнесу з call-center операціями, automation workflows, communication management. Provider-based architecture для SMS з прицілом на Болгарію. Webhook delivery tracking та event-driven architecture. STAFF CONTROL & PERFORMANCE MODULE для контролю менеджерів, модераторів, дзвінків, заявок, продуктивності, дисципліни.

## Зафіксований стек
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: React + Tailwind CSS + Framer Motion
- **UI/UX**: Light Theme (BIBI Cars branded)
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

### ✅ Activity Module (Mar 2026 - NEW)

**Architecture:**
- Global module for activity tracking
- Async logging (non-blocking)
- Performance aggregation service

**Activity Types:**
- Auth: login, logout, login_failed
- Leads: created, updated, assigned, reassigned, status_changed, converted
- Calls: started, completed, missed, no_answer, callback_scheduled/completed
- Tasks: created, updated, completed, overdue
- Messages: sms_sent/delivered/failed, email_sent/delivered/failed
- Documents: uploaded, verified, rejected, archived
- Deposits: created, confirmed, completed, refunded
- Deals: created, updated, status_changed, completed
- Routing: assigned, reassigned, fallback
- System: error, sla_breach

**API Endpoints:**
- GET /api/activity - всі активності з фільтрами
- GET /api/activity/recent - останні активності
- GET /api/activity/my - мої активності
- GET /api/activity/performance - performance менеджерів
- GET /api/activity/inactive-managers - неактивні менеджери

### ✅ Staff Control & Performance (Mar 2026 - NEW)

**Staff Management:**
- CRUD operations for staff
- Role management (master_admin, admin, moderator, manager, finance)
- Activate/deactivate users
- Password reset

**Performance Tracking:**
- Total actions per period
- Calls made/missed
- Leads handled/converted
- Tasks completed/overdue
- Conversion rate calculation
- Last activity timestamp

**UI Features:**
- Staff list with actions (edit, toggle active, reset password)
- Performance tab with period selector
- Inactive managers alert

### ✅ Documents UI (Mar 2026 - NEW)

**Features:**
- KPI cards (total, pending, verified, rejected, archived)
- All documents tab with filters (status, type, search)
- Verification queue tab (admin/finance only)
- Verify/Reject actions with reason
- Archive functionality

### ✅ Settings Page (Mar 2026 - NEW)

**Tabs:**
- General - system settings display
- Profile - edit user profile
- Security - change password, 2FA info
- Notifications - notification preferences

### ✅ Premium Light Theme UI/UX (Mar 2026)

**Design System:**
- **Color Palette**: 
  - Background: #F7F7F8
  - Surface: #FFFFFF
  - Primary: #18181B (Dark)
  - Text: #18181B / #71717A / #A1A1AA
  - Accents: Indigo #4F46E5, Emerald #059669, Amber #D97706, Red #DC2626
  
- **Typography**:
  - Headings: Cabinet Grotesk (medium weight)
  - Body: IBM Plex Sans
  
- **Components**:
  - Cards: rounded-2xl, soft borders (border-[#E4E4E7]), hover shadows
  - Buttons: rounded-xl, dark backgrounds, hover effects
  - Inputs: rounded-xl, light backgrounds, focus rings
  - Tables: clean design, horizontal borders only
  - Badges: pill-shaped with colored backgrounds
  
- **Motion**:
  - Framer Motion for page transitions
  - Smooth 300ms transitions

**Implemented Pages:**
- Login (gradient background, premium card)
- Dashboard (KPI cards with icons, all 8 sections)
- Leads (premium table, filters, create/edit modal)
- Customers (table, CRUD modal)
- Deals (table with status selector, CRUD modal)
- Deposits (table with approve action, create modal)
- Tasks (cards with status selector, create modal)
- Staff (list tab, performance tab, create/edit modal)
- Documents (KPI cards, verification queue, filters)
- Settings (4 tabs: general, profile, security, notifications)
- Layout (sidebar with active states)

### ✅ Bootstrap & Cold Start v2.0 (Mar 2026 - UPDATED)

**Auto-initialization на cold start:**
- Детекція холодного старту (немає master admin)
- Автоматичний seed всіх необхідних даних
- Перевірка та доповнення відсутніх даних при кожному запуску

**Seeded Data:**
1. **Users & Staff:**
   - master_admin (admin@crm.com / admin123)
   - admin, moderator, 2 managers, finance (staff123)
   
2. **Automation Rules (11 rules):**
   - Новий лід → Callback за 10 хв
   - Лід призначено → Welcome SMS
   - No-Answer Workflow (4 правила для 1-4 спроб)
   - Прострочена задача → Ескалація
   - Лід без активності 24г/48г
   - Депозит отримано → Повідомлення
   - Документ → Нотифікація
   
3. **Routing Rules:**
   - Default Routing (least_loaded)
   - VIP Leads (senior manager)
   - Website Leads (round_robin)
   - Phone Leads (first available)
   
4. **Message Templates (9 templates):**
   - Email: new_lead, task_reminder, deposit_alert
   - SMS (multilingual UK/EN/BG): welcome, follow_up, no_answer, callback, deposit_confirm
   
5. **System Settings:**
   - system_settings (company, languages, timezone, working hours)
   - lead_statuses, lead_sources
   - deal_statuses, deposit_statuses
   - document_types
   
6. **SLA Config:**
   - callback SLA (5/15/30/60 min)
   - lead SLA (10 min first response)
   - manager activity (120 min inactive)
   - escalation levels

**Bootstrap Status Display:**
```
╔══════════════════════════════════════╗
║       BIBI CRM Bootstrap Status      ║
╠══════════════════════════════════════╣
║ Version:           2.0.0             ║
║ MongoDB:           ✓ Connected       ║
║ Redis:             ⚠ Optional        ║
║ Admin User:        ✓ Ready           ║
║ Staff:             ✓ Ready           ║
║ Automation Rules:  ✓ Ready           ║
║ Routing Rules:     ✓ Ready           ║
║ Message Templates: ✓ Ready           ║
║ Settings:          ✓ Ready           ║
║ SLA Config:        ✓ Ready           ║
╠══════════════════════════════════════╣
║ System Ready:      ✓ YES             ║
╚══════════════════════════════════════╝
```

**API Endpoints:**
- GET /api/system/health - публічний health check
- GET /api/system/info - інформація про систему
- GET /api/system/status - детальний статус (admin)
- GET /api/system/ready - Kubernetes readiness
- GET /api/system/live - Kubernetes liveness
- POST /api/system/bootstrap - перезапуск bootstrap
- POST /api/system/seed - повний seed
- POST /api/system/seed/missing - seed тільки відсутніх
- POST /api/system/seed/test-leads - тестові ліди
- POST /api/system/clear-test-data - очистка тестових даних

### ✅ Call Control SLA Module (Mar 2026 - NEW)

**SLA Configuration:**
- CALLBACK_FIRST_RESPONSE_MINUTES: 5
- CALLBACK_ESCALATION_1_MINUTES: 30
- CALLBACK_ESCALATION_2_MINUTES: 60
- LEAD_FIRST_RESPONSE_MINUTES: 10
- MANAGER_INACTIVE_MINUTES: 120

**Cron Jobs:**
- Every 5 min: Callback SLA check
- Every 10 min: Lead SLA check
- Every hour: Performance aggregation & breach cleanup
- Daily 9:00: SLA summary report to admins

**Escalation Engine (3 levels):**
- Level 1: notify_manager
- Level 2: notify_manager + notify_admin + create_task
- Level 3: notify_manager + notify_admin + alert_master + create_task

**API Endpoints:**
- GET /api/sla/config - SLA configuration
- GET /api/sla/stats - breach statistics
- GET /api/sla/breaches - active breaches
- GET /api/sla/breaches/manager/:id - breaches by manager
- POST /api/sla/check/callbacks - manual callback check
- POST /api/sla/check/leads - manual lead check
- POST /api/sla/breaches/:type/:entityId/resolve - resolve breach

### ✅ Deposit Auto-Flow (Mar 2026 - NEW)

**Features:**
- Auto-create deposit_proof document on deposit creation
- 24-hour proof deadline
- Finance team notification
- Auto-verify document on deposit approval
- Check deposits without proof (for cron)

### ✅ Activity Integration Extended (Mar 2026)

**Integrated in:**
- AuthService: login
- LeadsService: create, update, assign, reassign, status_changed
- TasksService: create, update, complete
- DepositsService: create, confirm, complete
- SLA System: breach detection

## Test Results (Mar 2026)
- Backend: 93-100%
- Frontend: 100%
- Integration: 100%

## Backlog

### P0 - Critical
- [x] ~~Master Dashboard v2~~ ✅ DONE
- [x] ~~Premium Theme UI~~ ✅ DONE
- [x] ~~Activity Module~~ ✅ DONE
- [x] ~~Staff Performance~~ ✅ DONE
- [x] ~~Documents UI~~ ✅ DONE
- [x] ~~Call Control SLA breach detection~~ ✅ DONE
- [x] ~~Cron jobs for SLA checks~~ ✅ DONE
- [x] ~~Deposit Auto-Flow~~ ✅ DONE
- [ ] Configure Twilio credentials
- [ ] Configure S3 for production

### P1 - High Priority
- [ ] Parser integration
- [ ] Website binding
- [ ] WebSocket real-time dashboard updates

### P2 - Medium Priority
- [ ] Reviews module (Google reviews, site reviews)
- [ ] Client Cabinet (client sees own documents)
- [ ] Viber Business integration
- [ ] Activity timeline on lead/customer detail page

### P3 - Nice to Have
- [ ] AI Lead Scoring
- [ ] Document OCR
- [ ] WhatsApp Business integration
- [ ] E-signature integration

## Рольова ієрархія

| Role | Permissions |
|------|-------------|
| MASTER_ADMIN | Повний доступ, всі функції |
| ADMIN | Керує менеджерами, dashboard, performance |
| MODERATOR | Працює з лідами, обмежена аналітика |
| MANAGER | Працює з клієнтами, власні ліди |
| FINANCE | Депозити, документи, верифікація |

## Дата останнього оновлення
2026-03-26

## Наступні дії
1. Реалізувати Call Control SLA breach detection
2. Cron jobs для агрегації performance
3. WebSocket для real-time dashboard updates
4. Parser integration
5. Website deployment
