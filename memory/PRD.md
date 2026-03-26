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

## Реалізовано (Jan 2026)

### ✅ Webhook & Delivery Tracking System

**Architecture:**
```
communications/
├── webhooks/
│   ├── webhook.controller.ts    # POST /api/webhooks/twilio/status
│   └── webhook.service.ts       # Signature validation, status processing
├── timeline/
│   ├── timeline.controller.ts   # GET /api/communications/timeline/*
│   └── timeline.service.ts      # Event logging, escalation calculation
├── schemas/
│   ├── message.schema.ts        # Full delivery tracking model
│   └── communication-event.schema.ts  # Timeline events
└── providers/
    └── sms-provider.manager.ts  # Updated for Message schema
```

**Webhook Endpoints:**
- `POST /api/webhooks/twilio/status` - Twilio SMS delivery callbacks
- `POST /api/webhooks/resend/status` - Resend email callbacks (placeholder)
- `POST /api/webhooks/viber` - Viber callbacks (placeholder)
- `GET /api/webhooks/health` - Health check

**Message Schema (delivery tracking):**
```typescript
{
  id, leadId, customerId,
  channel, provider, direction,
  to, from, content,
  providerMessageId,        // MessageSid для webhook lookup
  status: 'queued' | 'sent' | 'delivered' | 'undelivered' | 'failed',
  errorCode, errorMessage,
  retryCount, maxRetries,
  sentAt, deliveredAt, failedAt
}
```

**Timeline Events:**
- `call_attempt`, `call_completed`, `call_missed`
- `sms_sent`, `sms_delivered`, `sms_failed`, `sms_undelivered`
- `email_sent`, `email_delivered`, `email_bounced`
- `callback_scheduled`, `followup_scheduled`
- `escalation`, `status_changed`

**Retry Logic:**
- Failed SMS auto-retry: 5min → 15min → 30min
- Max 3 retries per message

### ✅ Lead Contact Tracking

**Updated Lead Schema:**
```typescript
{
  callAttempts: number,
  smsAttempts: number,
  emailAttempts: number,
  lastContactAt: Date,
  nextFollowUpAt: Date,
  escalationLevel: number,  // 0-4
  lastSmsDeliveredAt: Date,
  lastEmailDeliveredAt: Date
}
```

**Escalation Levels:**
- 0 = New (no contact)
- 1 = First call attempt
- 2 = 2+ call attempts
- 3 = SMS sent
- 4 = Cold/Unreachable (after failed SMS or 4+ attempts)

### ✅ Automation Engine (9 rules)

**No-Answer Workflow:**
1. 1st no_answer → follow-up 2h
2. 2nd no_answer → follow-up 2 days
3. 3rd no_answer → **SMS auto-send** + follow-up 3 days
4. 4th no_answer → escalation to cold/unreachable

**Event-Driven Actions:**
- `sms.delivered` → update timeline, contact tracking
- `sms.failed` → schedule retry
- `sms.undelivered` → fallback channel trigger

## API Endpoints

### Webhooks (Public - no JWT)
```
POST /api/webhooks/twilio/status    # Twilio SMS callback
POST /api/webhooks/resend/status    # Resend email callback
POST /api/webhooks/viber            # Viber callback
GET  /api/webhooks/health           # Health check
GET  /api/webhooks/messages/:id/status  # Manual status check
```

### Timeline (Protected)
```
GET /api/communications/timeline/lead/:leadId
GET /api/communications/timeline/lead/:leadId/stats
GET /api/communications/timeline/customer/:customerId
```

### Communications
```
POST /api/communications/send
POST /api/communications/sms/send
GET  /api/communications/sms/providers
GET  /api/communications/history/:recipientId
CRUD /api/communications/templates
```

## Configuration Required

### Twilio SMS (Bulgaria)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+359XXXXXXXXX
TWILIO_STATUS_CALLBACK_URL=https://your-domain/api/webhooks/twilio/status
```

### Resend Email
```env
RESEND_API_KEY=re_xxxxxxxx
SENDER_EMAIL=noreply@yourdomain.com
```

## Test Results (Jan 2026)
- Backend: 91.7%
- Webhook System: 100%
- Integration: 100%

## Backlog

### P0 - Critical
- [ ] Configure Twilio credentials
- [ ] Configure webhook URL in Twilio Console

### P1 - High Priority
- [ ] Viber Business integration
- [ ] UI: Communication timeline в картці ліда
- [ ] UI: Delivery status badges
- [ ] File/Document storage

### P2 - Medium Priority
- [ ] Resend webhook integration
- [ ] Rate limiting for SMS
- [ ] Reviews module

### P3 - Nice to Have
- [ ] AI Lead Scoring
- [ ] WhatsApp Business integration

## Дата останнього оновлення
2026-03-26

## Наступні дії
1. Налаштувати `TWILIO_*` в .env
2. Встановити `TWILIO_STATUS_CALLBACK_URL` в Twilio Console
3. Додати UI для timeline в картці ліда
4. Тестувати real delivery tracking
