# BIBI Cars CRM - VIN Intelligence Engine PRD

## Original Problem Statement
CRM система для автобізнесу (BIBI Cars) з парсером аукціонів (Copart/IAAI) та VIN Intelligence Engine для 100% coverage.

## Architecture

### Tech Stack
- **Backend:** NestJS + TypeScript + MongoDB
- **Frontend:** React + Tailwind CSS + Phosphor Icons
- **Database:** MongoDB
- **Theme:** Light (matching admin panel UI)

### Core Modules

#### 1. VIN Engine Module (`/modules/vin-engine/`)
- `search.provider.ts` - пошук через DuckDuckGo
- `url-filter.service.ts` - фільтрація та пріоритизація URL
- `extractor.service.ts` - витягування даних зі сторінок
- `vin-merge.service.ts` - об'єднання результатів
- `vin-cache.service.ts` - кешування (TTL 7 днів)
- `vin-search.service.ts` - головний VIN search service

#### 2. Source Registry Module (`/modules/source-registry/`) - NEW
- `source.schema.ts` - MongoDB модель для джерел
- `source-registry.service.ts` - керування джерелами
- `source-registry.controller.ts` - Admin API endpoints

#### 3. Pipeline Module (`/modules/pipeline/`)
- Нормалізація, дедуплікація, мердж, скоринг

#### 4. Ingestion Module (`/modules/ingestion/`)
- Parser runners (Copart, IAAI)
- Antiblock system

## Implemented Features

### 2026-03-27 (Current Session)

#### Source Registry Module
- [x] MongoDB schema для джерел з полями: name, displayName, type, enabled, weight, priority, successCount, failCount, avgResponseTime
- [x] Auto-seed 7 default sources при старті
- [x] API endpoints:
  - GET /api/admin/sources - список всіх джерел
  - PATCH /api/admin/sources/:name/toggle - вкл/викл джерело
  - PATCH /api/admin/sources/:name/weight - змінити вагу
  - POST /api/admin/sources/:name/reset-stats - скинути статистику

#### VIN Search UI (Updated)
- [x] Light theme matching admin panel
- [x] VIN search form with counter
- [x] Sources panel with toggle controls
- [x] Weight sliders for each source
- [x] Success rate display
- [x] Source type badges (База, Агрегатор, Конкурент, Web)

### Default Sources
| Name | Type | Weight | Priority |
|------|------|--------|----------|
| local_db | database | 1.0 | 1 |
| bidfax | aggregator | 0.80 | 10 |
| poctra | aggregator | 0.75 | 11 |
| stat_vin | aggregator | 0.80 | 12 |
| autobidmaster | competitor | 0.70 | 20 |
| salvagebid | competitor | 0.70 | 21 |
| web_search | web_search | 0.55 | 50 |

## API Endpoints

### Source Registry (Admin)
```
GET    /api/admin/sources              - список всіх джерел
GET    /api/admin/sources/enabled      - тільки активні
PATCH  /api/admin/sources/:name/toggle - вкл/викл
PATCH  /api/admin/sources/:name/weight - змінити вагу
PATCH  /api/admin/sources/:name/priority - змінити пріоритет
POST   /api/admin/sources/:name/reset-stats - скинути статистику
```

### VIN Search (Authenticated)
```
GET    /api/vin/search?vin=XXX        - пошук VIN
GET    /api/vin/:vin                   - пошук за параметром
GET    /api/vin/admin/cache-stats      - статистика кешу
```

## Test Results (2026-03-27)
- Backend: 84.6% (22/26 tests passed)
- Frontend: 95% (core functionality working)
- Overall: 90%

## Credentials
- Admin: admin@crm.com / admin123
- API: https://dev-continue-27.preview.emergentagent.com

## Backlog

### P0 (Critical) - COMPLETED
- [x] VIN Intelligence Engine
- [x] Source Registry Module
- [x] Admin control for sources
- [x] Light theme UI

### P1 (High Priority)
- [ ] Auto-optimization engine (auto weight adjustment based on success rate)
- [ ] WebSocket real-time updates
- [ ] Cron jobs для автопарсингу

### P2 (Medium)
- [ ] Health scoring for sources
- [ ] Source ranking AI logic
- [ ] Email notifications

### P3 (Nice to have)
- [ ] Export to CSV/Excel
- [ ] API rate limiting
- [ ] Analytics dashboard

## Next Steps
1. Auto-optimization engine - автоматична зміна ваг джерел
2. WebSocket для real-time статусу
3. Cron jobs для автопарсингу
