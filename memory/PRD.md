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

### ✅ Automation Engine (11+ rules)
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
- 9 specialized dashboard services (including Vehicles)
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
9. **Vehicles** - total, active, sold, reserved, newToday, updatedToday, avgPrice, bySource

### ✅ Activity Module (Mar 2026)

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
- **Vehicles**: created, updated, status_changed, reserved, linked, deleted
- System: error, sla_breach

### ✅ Staff Control & Performance (Mar 2026)

**Staff Management:**
- CRUD operations for staff
- Role management (master_admin, admin, moderator, manager, finance)
- Activate/deactivate users
- Password reset
- Performance tracking

### ✅ Call Control SLA Module (Mar 2026)

**SLA Configuration:**
- Callback SLA (5/15/30/60 min escalation)
- Lead SLA (10 min first response)
- Manager activity (120 min inactive)
- 3-level escalation engine

### ✅ Parser Integration Layer (Mar 2026 - NEW!)

**Architecture:**
```
Parser → Webhook → Raw Data → Normalize → Save → Activity
```

**New Module:** `/app/backend/src/modules/ingestion/`
- `schemas/parser-raw-data.schema.ts` - Raw payload storage
- `schemas/vehicle.schema.ts` - Normalized vehicle model
- `services/ingestion.service.ts` - Webhook processing
- `services/vehicle.service.ts` - CRUD + deduplication
- `controllers/ingestion.controller.ts` - API endpoints
- `enums/vehicle.enum.ts` - VehicleSource, VehicleStatus

**Webhook Endpoints (Public):**
- `POST /api/ingestion/parser/vehicle` - Single vehicle
- `POST /api/ingestion/parser/batch` - Batch import

**Vehicle Endpoints (Protected):**
- `GET /api/ingestion/vehicles` - List with filters
- `GET /api/ingestion/vehicles/stats` - Statistics
- `GET /api/ingestion/vehicles/:id` - Get by ID
- `GET /api/ingestion/vehicles/vin/:vin` - Get by VIN
- `GET /api/ingestion/vehicles/makes` - Unique makes
- `GET /api/ingestion/vehicles/models` - Unique models
- `POST /api/ingestion/vehicles/:id/status` - Change status
- `POST /api/ingestion/vehicles/:id/link` - Link to CRM

**Debug Endpoints:**
- `GET /api/ingestion/raw-data` - Raw data debug
- `POST /api/ingestion/reprocess` - Reprocess failed

**Vehicle Schema:**
```typescript
{
  vin: string (PRIMARY KEY - unique),
  source: 'copart' | 'iaai' | 'manheim' | 'other' | 'manual',
  externalId: string,
  title: string,
  make?: string,
  vehicleModel?: string,
  year?: number,
  mileage?: number,
  price?: number,
  currency?: string,
  images: string[],
  status: 'active' | 'sold' | 'reserved' | 'archived' | 'pending',
  lastSyncedAt: Date,
  syncCount: number,
  // ... more fields
}
```

**Features:**
- VIN-based deduplication (if VIN exists → update, else → create)
- VIN validation (17 chars, valid format)
- Raw data storage for debug & reprocessing
- Activity logging integration
- Dashboard integration with vehicles section

### ✅ Bootstrap & Cold Start v2.0 (Mar 2026)

**Auto-initialization:**
- Admin: admin@crm.com / admin123
- Staff: 5 users (admin, moderator, 2 managers, finance)
- 11 automation rules
- 4 routing rules
- 9 message templates
- System settings + SLA config

## Test Results (Mar 2026)
- Backend: 100% (20/20 tests - Parser Integration)
- Frontend: 100%
- Integration: 100%

## Backlog

### P0 - Critical
- [x] ~~Master Dashboard v2~~ ✅ DONE
- [x] ~~Activity Module~~ ✅ DONE
- [x] ~~Staff Performance~~ ✅ DONE
- [x] ~~Call Control SLA~~ ✅ DONE
- [x] ~~Parser Integration~~ ✅ DONE
- [ ] Configure Twilio credentials
- [ ] Configure S3 for production

### P1 - High Priority
- [ ] Vehicles UI page in frontend
- [ ] WebSocket real-time dashboard updates
- [ ] Website binding (public catalog from vehicles)

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
1. Vehicles UI page in frontend
2. WebSocket для real-time dashboard updates
3. Public API + Website з каталогом авто
4. Twilio/S3 production configuration
