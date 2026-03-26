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

**API:**
- POST /api/lead-routing/assign/:leadId
- POST /api/lead-routing/reassign/:leadId
- GET /api/lead-routing/workload
- GET /api/lead-routing/history/:leadId
- CRUD для routing rules

### ✅ Files & Documents Module (Mar 2026 - NEW)

**Architecture:**
```
modules/
  files/                          # Infrastructure layer
    controllers/files.controller.ts
    services/
      files.service.ts
      file-access.service.ts
    providers/
      local-storage.provider.ts
      s3-storage.provider.ts
      storage-provider.factory.ts
    schemas/file.schema.ts
    interfaces/storage-provider.interface.ts

  documents/                      # Business layer
    controllers/documents.controller.ts
    services/documents.service.ts
    schemas/document.schema.ts
    enums/document.enum.ts
```

**File Schema:**
```typescript
{
  id, filename, originalName, extension, mimeType, size,
  storageKey, storageProvider: 's3' | 'local',
  uploadedBy, relatedTo: { entityType, entityId },
  tags[], access: 'private' | 'restricted' | 'public',
  metadata: { checksum, source, note }
}
```

**Document Types:**
- contract
- invoice
- deposit_proof
- client_document
- delivery_document
- custom

**Document Statuses:**
- draft → uploaded → pending_verification → verified/rejected → archived

**Verification Flow:**
1. Upload файл
2. Створити document з fileIds
3. Submit for verification
4. Admin/Finance verify або reject
5. Notifications + Audit logs

**Files API:**
- POST /api/files/upload
- GET /api/files/:id
- GET /api/files/:id/url (signed URL)
- DELETE /api/files/:id
- GET /api/files/entity/:entityType/:entityId

**Documents API:**
- POST /api/documents
- GET /api/documents/:id
- PATCH /api/documents/:id
- POST /api/documents/:id/attach-files
- POST /api/documents/:id/submit-for-verification
- POST /api/documents/:id/verify
- POST /api/documents/:id/reject
- POST /api/documents/:id/archive
- GET /api/documents/queue/pending-verification
- GET /api/documents/customer/:customerId
- GET /api/documents/deal/:dealId
- GET /api/documents/deposit/:depositId

**Storage Providers:**
- LocalStorageProvider - /app/uploads (dev)
- S3StorageProvider - AWS S3 compatible (prod)

**Access Control:**
- Admin: all access
- Manager: own related files
- Finance: financial documents only

## Test Results (Mar 2026)
- Backend Lead Routing: 100%
- Backend Files/Documents: 100%
- All verification workflows working ✓

## Backlog

### P0 - Critical
- [ ] Configure Twilio credentials
- [ ] Configure S3 for production

### P1 - High Priority
- [ ] **Master Dashboard v2** (SLA breaches, workload heatmap, stuck leads)
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
1. **Master Dashboard v2** - візуалізація навантаження, SLA breaches, pending verification queue
2. Deposit integration - автоматичне створення deposit_proof при завантаженні
3. UI components для файлів та документів
4. Cron jobs для SLA monitoring
