# BIBI Cars CRM - VIN Intelligence Engine PRD

## Original Problem Statement
CRM система для автобізнесу (BIBI Cars) з парсером аукціонів (Copart/IAAI) та VIN Intelligence Engine для 100% coverage без залежності від API або дорогих проксі.

## Architecture

### Tech Stack
- **Backend:** NestJS + TypeScript + MongoDB
- **Frontend:** React + Tailwind CSS + Phosphor Icons
- **Database:** MongoDB (vehicles, vin_cache, parser state, logs, proxies, leads)
- **Browser Automation:** Puppeteer + Playwright (chromium-1208)

### Core Modules

#### 1. Pipeline Module (`/modules/pipeline/`)
- `normalize.service.ts` - нормалізація сирих даних
- `dedup.service.ts` - дедуплікація по VIN
- `merge.service.ts` - об'єднання даних з різних джерел
- `scoring.service.ts` - оцінка якості даних
- `auction-classifier.service.ts` - класифікація аукціонів
- `pipeline.service.ts` - головний orchestrator

#### 2. VIN Engine Module (`/modules/vin-engine/`)

##### Core Services (existing)
- `search.provider.ts` - пошук через DuckDuckGo
- `url-filter.service.ts` - фільтрація та пріоритизація URL
- `extractor.service.ts` - витягування даних зі сторінок
- `vin-merge.service.ts` - об'єднання результатів
- `vin-cache.service.ts` - кешування (TTL 7 днів)
- `vin-search.service.ts` - головний VIN search service
- `vin-search.controller.ts` - API endpoints

##### Provider-based Architecture (NEW - 2026-03-27)
- `/interfaces/vin-search-provider.interface.ts` - VinSearchProvider interface
- `/providers/db.provider.ts` - пошук в локальній базі
- `/providers/aggregator-search.provider.ts` - пошук через агрегатори (bidfax, poctra, stat.vin)
- `/providers/competitor-search.provider.ts` - пошук через конкурентів (autobidmaster, salvagebid)
- `/providers/source-weight.service.ts` - ваги джерел для ранжування
- `/providers/vin-candidate-scoring.service.ts` - скоринг кандидатів
- `/providers/result-merge.service.ts` - мердж результатів
- `/providers/vin-search-orchestrator.service.ts` - головний orchestrator

##### Public VIN Layer (NEW - 2026-03-27)
- `/dto/public-vin.dto.ts` - DTOs для публічних endpoints
- `/public-vin.controller.ts` - публічні endpoints без авторизації

#### 3. Leads Module (`/modules/leads/`)
- CRM leads management
- VIN-to-Lead integration

#### 4. Ingestion Module (existing)
- Parser runners (Copart, IAAI)
- Antiblock system (Circuit Breaker, Proxy Pool, Fingerprint)
- Vehicles service

## User Personas

### 1. Публічний користувач (VIN Search)
- Шукає інформацію про авто за VIN
- Може залишити заявку на покупку
- Не потребує реєстрації

### 2. Менеджер з продажу
- Обробляє ліди з VIN Search
- Працює з клієнтами в CRM
- Переглядає статистику

### 3. Адміністратор
- Керує парсерами та проксі
- Налаштовує систему
- Переглядає логи

## User Flow

### Public VIN Search Flow (NEW)
```
Користувач заходить на /vin-check
    ↓
Вводить VIN код (17 символів)
    ↓
Система шукає:
1. Local Database
2. VIN Cache
3. Multi-source providers (DB → Aggregators → Competitors → Web Search)
    ↓
Результат знайдено?
    ↓
Так → Показуємо:
- Фото авто
- Ціна
- Дата аукціону + Countdown Timer
- Локація
- Пошкодження
- Кнопка "Хочу купити це авто"
    ↓
Ні → Показуємо "Не знайдено" + кнопка "Запитати про авто"
    ↓
Клік на кнопку → Lead Form
    ↓
Заповнення форми (ім'я, email, телефон)
    ↓
Lead створюється в CRM з автозаповненням VIN + ціна + локація
    ↓
Менеджер отримує лід
```

## API Endpoints

### Public VIN API (NEW - без авторизації)
- `GET /api/public/vin/search?vin=XXX` - публічний пошук VIN
- `GET /api/public/vin/:vin` - пошук за параметром (SEO-friendly)
- `POST /api/public/vin/lead` - створення ліда з VIN сторінки

### VIN Engine (authenticated)
- `GET /api/vin/search?vin=XXX` - пошук VIN (admin)
- `GET /api/vin/:vin` - пошук за параметром
- `GET /api/vin/admin/cache-stats` - статистика кешу (admin)
- `DELETE /api/vin/admin/cache/:vin?` - очистка кешу (admin)
- `POST /api/vin/:vin/refresh` - примусове оновлення (admin)

### Vehicles
- `GET /api/vehicles` - список авто
- `GET /api/vehicles/:id` - деталі авто
- `GET /api/vehicles/stats` - статистика
- `GET /api/vehicles/makes` - список марок

### Leads
- `GET /api/leads` - список лідів
- `POST /api/leads` - створення ліда
- `PUT /api/leads/:id` - оновлення ліда
- `DELETE /api/leads/:id` - видалення ліда

### Parser Admin
- `GET /api/ingestion/admin/parsers` - статус парсерів
- `POST /api/ingestion/admin/parsers/:source/run` - запуск
- `POST /api/ingestion/admin/parsers/:source/stop` - зупинка

## Implemented Features

### 2026-03-27 (Current Session)

#### Backend
- [x] Provider-based VIN Engine Architecture
  - VinSearchProvider interface
  - DbVinSearchProvider (local database)
  - AggregatorSearchProvider (bidfax, poctra, stat.vin)
  - CompetitorSearchProvider (autobidmaster, salvagebid)
  - SourceWeightService (source ranking)
  - VinCandidateScoringService (confidence scoring)
  - ResultMergeService (merging from multiple sources)
  - VinSearchOrchestratorService (main orchestrator)
- [x] Public VIN Controller
  - GET /api/public/vin/search
  - GET /api/public/vin/:vin
  - POST /api/public/vin/lead
- [x] Lead creation from VIN page with auto-fill (VIN, price, location)

#### Frontend
- [x] PublicVinSearch page (`/vin-check`, `/vin-check/:vin`)
- [x] VIN search with result display
- [x] Auction countdown timer
- [x] "Хочу купити це авто" → Lead form
- [x] Lead form with validation
- [x] Success/error states
- [x] SEO-friendly routes

### Previously Implemented
- [x] Pipeline Module (normalize, dedup, merge, scoring)
- [x] VIN Intelligence Engine (search, extract, cache)
- [x] Parser Control Center APIs
- [x] Vehicles CRUD with filters
- [x] Proxy management with MongoDB persistence
- [x] Health monitoring & Circuit Breaker
- [x] VIN Search page (internal, authenticated)
- [x] Parser Control Center UI
- [x] Vehicles page with cards
- [x] Proxy Manager
- [x] Parser Logs & Settings

### Test Results (2026-03-27)
- Backend: 100% (5/5 public VIN endpoints working)
- Frontend: 100% (All UI flows and integrations working)
- All 12 test cases passed

## Data Quality Scoring

```javascript
score = 
  hasVIN(17 chars) * 0.40 +
  hasSaleDate * 0.20 +
  hasImages * 0.10 +
  hasPrice * 0.10 +
  isAuction * 0.10 +
  sourceWeight * 0.10
```

### Source Trust Scores
- local_db: 1.0
- copart, iaai: 0.95
- autobidmaster, salvagebid: 0.85
- bidfax, poctra, stat_vin: 0.75-0.80
- competitor_default: 0.70
- aggregator_default: 0.75
- web_search_default: 0.55

## Configuration

### Credentials
- Admin: admin@crm.com / admin123
- API: https://dev-continue-27.preview.emergentagent.com

### Public Routes
- /vin-check - VIN Search landing page
- /vin-check/:vin - Direct VIN lookup (SEO)
- /public/vin - Alternative route
- /public/vin/:vin - Alternative direct lookup

### Cache Settings
- VIN Cache TTL: 7 days
- Auto-expire via MongoDB TTL index

## Backlog

### P0 (Critical) - COMPLETED
- [x] VIN Intelligence Engine
- [x] Pipeline Module
- [x] VIN Search UI
- [x] Public VIN Search page (SEO)
- [x] Lead Flow (VIN → CRM)
- [x] Auction Timer

### P1 (High Priority)
- [ ] Source Registry в MongoDB (enable/disable providers)
- [ ] Admin UI для provider priorities
- [ ] WebSocket real-time updates
- [ ] Cron jobs для автопарсингу

### P2 (Medium)
- [ ] Client Cabinet (особистий кабінет)
- [ ] Mobile responsive optimization
- [ ] Email notifications про нові ліди

### P3 (Nice to have)
- [ ] Export to CSV/Excel
- [ ] API rate limiting
- [ ] Analytics dashboard

## Next Steps
1. Source Registry в MongoDB з admin control
2. WebSocket для real-time статусу парсингу
3. Email notifications для нових лідів
