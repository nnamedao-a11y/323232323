# CRM/Admin Platform - PRD

## Оригінальна постановка задачі
Full CRM/Admin platform для автобізнесу з call-center операціями, automation workflows, communication management. Parser Integration Layer для прийому даних з аукціонів (Copart, IAAI).

## Зафіксований стек
- **Backend**: NestJS + TypeScript + MongoDB
- **Frontend**: React + Tailwind CSS + Framer Motion
- **UI/UX**: Light Theme (BIBI Cars branded)
- **Cache/Queues**: Redis + Bull (6 черг)
- **SMS**: Provider abstraction layer (Twilio + Viber placeholder)
- **File Storage**: Local + S3 abstraction
- **Parser**: Puppeteer + Anti-block layer

## Реалізовано (Jan 2026 - Mar 2026)

### ✅ Core CRM
- Leads, Customers, Deals, Deposits, Tasks

### ✅ Webhook & Delivery Tracking
### ✅ Automation Engine (11+ rules)
### ✅ Lead Routing Module v1
### ✅ Files & Documents Module
### ✅ Master Dashboard v2 (9 sections)
### ✅ Activity Module
### ✅ Staff Control & Performance
### ✅ Call Control SLA Module
### ✅ Deposit Auto-Flow

### ✅ Parser Integration Layer v2 (Mar 2026 - NEW!)

**Архітектура:**
```
Parser Runner → Universal Scraper → Raw Storage → Normalize → Dedup (VIN) → Vehicle → Activity → Dashboard
```

**Модуль:** `/app/backend/src/modules/ingestion/`

```
ingestion/
├── antiblock/              ← Захист від виявлення (скопійовано)
│   ├── proxy-pool.service.ts
│   ├── enhanced-proxy-pool.service.ts
│   ├── http-fingerprint.service.ts
│   ├── circuit-breaker.service.ts
│   ├── parser-guard.service.ts
│   ├── parser-health.service.ts
│   ├── resilient-fetch.service.ts
│   ├── retry.util.ts
│
├── scraping-core/          ← Базовий скрапінг (скопійовано)
│   ├── browser-session.manager.ts
│   ├── universal-scraper.ts
│   ├── network-interceptor.ts
│   ├── retry-fallback.ts
│
├── runners/                ← Парсери для джерел
│   ├── copart.runner.ts    ← Copart.com parser
│   ├── iaai.runner.ts      ← IAAI.com parser
│
├── normalize/              ← Нормалізація даних
│   ├── copart.normalize.ts
│   ├── iaai.normalize.ts
│
├── schemas/
│   ├── parser-raw-data.schema.ts
│   ├── vehicle.schema.ts
│
├── services/
│   ├── ingestion.service.ts
│   ├── vehicle.service.ts
```

**Antiblock Features:**
- Proxy Pool з failover (не rotation)
- HTTP Fingerprint ротація (6 User-Agents)
- Circuit Breaker (5 failures = OPEN, 10 min cooldown)
- Exponential Backoff з jitter
- Parser Health monitoring
- Rate limiter

**Runner Endpoints:**
- `GET /api/ingestion/runners/status` - статус runners
- `GET /api/ingestion/health` - health dashboard
- `POST /api/ingestion/runners/copart/run` - manual run
- `POST /api/ingestion/runners/iaai/run` - manual run
- `POST /api/ingestion/runners/all/run` - run all
- `POST /api/ingestion/circuit-breaker/reset` - reset

**CRON Jobs:**
- Copart: `0 */4 * * *` (кожні 4 години)
- IAAI: `30 */4 * * *` (зміщено на 30 хв)

**Normalization:**
- VIN extraction та validation (17 chars)
- Title generation (Year Make Model)
- Price extraction (currentBid, highBid, buyNow)
- Images extraction та dedupe
- Condition grade mapping (A/B/C/D)
- Metadata preservation

**Deduplication:**
- VIN = PRIMARY KEY
- if VIN exists → UPDATE
- else → CREATE

## Test Results (Mar 2026)
- Backend: 92.3% (24/26 tests)
- Note: Runner timeouts expected (placeholder API)

## Backlog

### P0 - Critical
- [x] ~~Master Dashboard v2~~ ✅
- [x] ~~Activity Module~~ ✅
- [x] ~~Parser Integration v1~~ ✅
- [x] ~~Parser Integration v2 (antiblock)~~ ✅
- [ ] Configure real Copart/IAAI API credentials
- [ ] Configure proxy list

### P1 - High Priority
- [ ] Vehicles UI page in frontend
- [ ] WebSocket real-time dashboard updates
- [ ] Public API + Website

### P2 - Medium Priority
- [ ] Reviews module
- [ ] Client Cabinet

### P3 - Nice to Have
- [ ] AI Lead Scoring
- [ ] Document OCR

## Дата останнього оновлення
2026-03-26

## Наступні дії
1. Налаштувати реальні Copart/IAAI API credentials
2. Додати proxy list до EnhancedProxyPool
3. Vehicles UI page
4. Public Website з каталогом
