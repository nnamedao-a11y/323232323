# CRM/Admin Platform - PRD

## Оригінальна постановка задачі
Full CRM/Admin platform для автобізнесу з call-center операціями, automation workflows, communication management. Provider-based architecture для SMS з прицілом на Болгарію. Webhook delivery tracking та event-driven architecture.

## Зафіксований стек
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: React + Tailwind CSS
- **Cache/Queues**: Redis + Bull (6 черг)
- **SMS**: Provider abstraction layer (Twilio + Viber placeholder)
- **Webhooks**: Twilio delivery status callbacks
- **Архітектура**: Event-driven, modular monolith
- **Мова інтерфейсу**: Українська (адмін), UK/EN/BG (шаблони)

## Реалізовано (Jan 2026 - Mar 2026)

### ✅ Webhook & Delivery Tracking System
- POST /api/webhooks/twilio/status - Twilio SMS delivery callbacks
- POST /api/webhooks/resend/status - Resend email callbacks (placeholder)
- POST /api/webhooks/viber - Viber callbacks (placeholder)
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

### ✅ Lead Routing Module v1 (Mar 2026 - NEW)

**Architecture:**
```
modules/
  lead-routing/
    controllers/
      lead-routing.controller.ts
    services/
      lead-routing.service.ts        # Main orchestration
      lead-routing-strategy.service.ts  # Strategy selection
      manager-availability.service.ts   # Manager filtering
      routing-rules.service.ts          # Rules CRUD
    schemas/
      routing-rule.schema.ts
      assignment-history.schema.ts
    dto/
      routing.dto.ts
    enums/
      assignment.enum.ts
    interfaces/
      routing.interface.ts
```

**Routing Strategies:**
- `least_loaded` - основна стратегія (score = activeLeads*2 + openTasks + overdueTasks*3)
- `round_robin` - рівномірний розподіл по lastAssignedAt
- `fallback` - fallback manager або queue
- `manual` - ручне призначення
- `overdue_reassign` - перепризначення при SLA breach

**Default Routing Rules:**
1. Default - Least Loaded (priority: 0)
2. Bulgaria Market (priority: 50)
3. Phone/Missed Call - Round Robin (priority: 60, SLA: 5 min)
4. VIP Leads (priority: 100, SLA: 5 min)

**API Endpoints:**
```
POST /api/lead-routing/assign/:leadId      # Auto/force assignment
POST /api/lead-routing/reassign/:leadId    # Manual reassignment
GET  /api/lead-routing/history/:leadId     # Assignment history
GET  /api/lead-routing/workload            # Manager workload matrix
GET  /api/lead-routing/fallback-queue      # Fallback queue items
POST /api/lead-routing/fallback-queue/:id/resolve
GET  /api/lead-routing/rules               # CRUD routing rules
POST /api/lead-routing/rules
PATCH /api/lead-routing/rules/:id
DELETE /api/lead-routing/rules/:id
POST /api/lead-routing/rules/:id/toggle
```

**Lead Schema (нові поля):**
```typescript
{
  assignedTo?: string,
  assignedAt?: Date,
  assignmentStrategy?: string,
  assignmentReason?: string,
  reassignedCount: number,
  firstResponseDueAt?: Date,
  firstResponseAt?: Date,
  isOverdueForFirstResponse: boolean
}
```

**User Schema (нові поля):**
```typescript
{
  isAvailableForAssignment: boolean,
  assignmentPriority?: number,
  supportedMarkets: string[],
  supportedLanguages: string[],
  supportedLeadSources: string[],
  maxActiveLeads?: number,
  currentActiveLeads: number,
  currentOpenTasks: number,
  currentOverdueTasks: number,
  lastAssignedAt?: Date
}
```

**Automation Integration:**
- При `lead_created` автоматично викликається `ASSIGN_MANAGER` action
- Routing створює task "Зв'язатися" з 10 хв deadline
- Notification менеджеру про нового ліда

## Test Results (Mar 2026)
- Backend Lead Routing: 100%
- All routing endpoints working
- Auto-assignment on lead creation ✓
- Assignment history tracking ✓
- Workload matrix calculation ✓

## Backlog

### P0 - Critical
- [ ] Configure Twilio credentials
- [ ] Configure webhook URL in Twilio Console

### P1 - High Priority
- [ ] Documents / File Storage (contracts, deposits)
- [ ] UI: Communication timeline в картці ліда
- [ ] UI: Lead assignment UI with workload view
- [ ] Viber Business integration
- [ ] SLA overdue auto-reassignment cron job

### P2 - Medium Priority
- [ ] Master Dashboard v2 (lead load by manager, SLA breaches)
- [ ] Resend webhook integration
- [ ] Rate limiting for SMS
- [ ] Reviews module

### P3 - Nice to Have
- [ ] AI Lead Scoring
- [ ] WhatsApp Business integration
- [ ] Advanced routing (skill-based, timezone)
- [ ] Vacation calendars

## Дата останнього оновлення
2026-03-26

## Наступні дії
1. Реалізувати Documents / File Storage модуль
2. Додати UI для lead assignment workload
3. Налаштувати cron job для SLA monitoring
4. Додати UI для routing rules management
