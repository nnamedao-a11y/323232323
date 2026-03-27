# BIBI Cars CRM - VIN Intelligence Engine PRD

## Original Problem Statement
CRM система для автобізнесу (BIBI Cars) з парсером аукціонів (Copart/IAAI) та VIN Intelligence Engine для 100% coverage без залежності від API або дорогих проксі.

## Architecture

### Tech Stack
- **Backend:** NestJS + TypeScript + MongoDB
- **Frontend:** React + Tailwind CSS + Phosphor Icons
- **Database:** MongoDB (vehicles, vin_cache, parser state, logs, proxies)
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
- `search.provider.ts` - пошук через DuckDuckGo
- `url-filter.service.ts` - фільтрація та пріоритизація URL
- `extractor.service.ts` - витягування даних зі сторінок
- `vin-merge.service.ts` - об'єднання результатів
- `vin-cache.service.ts` - кешування (TTL 7 днів)
- `vin-search.service.ts` - головний VIN search service
- `vin-search.controller.ts` - API endpoints

#### 3. Ingestion Module (existing)
- Parser runners (Copart, IAAI)
- Antiblock system (Circuit Breaker, Proxy Pool, Fingerprint)
- Vehicles service

## User Flow

### VIN Search Flow
```
User вводить VIN
    ↓
1. Пошук в Database
    ↓
Знайдено? → Повертаємо результат
    ↓ (Ні)
2. Перевірка Cache
    ↓
В кеші? → Повертаємо/зберігаємо в DB
    ↓ (Ні)
3. Web Search (DuckDuckGo)
    ↓
4. URL Filter & Prioritize
    ↓
5. Extract data from pages
    ↓
6. Merge results
    ↓
7. Score & Save to DB + Cache
    ↓
Повертаємо результат
```

## API Endpoints

### VIN Engine
- `GET /api/vin/search?vin=XXX` - публічний пошук VIN
- `GET /api/vin/:vin` - пошук за параметром
- `GET /api/vin/admin/cache-stats` - статистика кешу (admin)
- `DELETE /api/vin/admin/cache/:vin?` - очистка кешу (admin)
- `POST /api/vin/:vin/refresh` - примусове оновлення (admin)

### Vehicles
- `GET /api/vehicles` - список авто
- `GET /api/vehicles/:id` - деталі авто
- `GET /api/vehicles/stats` - статистика
- `GET /api/vehicles/makes` - список марок

### Parser Admin
- `GET /api/ingestion/admin/parsers` - статус парсерів
- `POST /api/ingestion/admin/parsers/:source/run` - запуск
- `POST /api/ingestion/admin/parsers/:source/stop` - зупинка

## Implemented Features (2026-03-27)

### Backend
- [x] Pipeline Module (normalize, dedup, merge, scoring)
- [x] VIN Intelligence Engine (search, extract, cache)
- [x] Parser Control Center APIs
- [x] Vehicles CRUD with filters
- [x] Proxy management with MongoDB persistence
- [x] Health monitoring & Circuit Breaker

### Frontend
- [x] VIN Search page with results display
- [x] Parser Control Center
- [x] Vehicles page with cards
- [x] Proxy Manager
- [x] Parser Logs & Settings

### Test Results
- Backend: 100% (14/14 tests passed)
- Frontend: 95% (VIN search, vehicles working)

## Data Quality Scoring

```javascript
score = 
  hasVIN(17 chars) * 0.25 +
  hasSaleDate * 0.20 +
  hasImages * 0.15 +
  hasPrice * 0.10 +
  hasTitle * 0.10 +
  hasDamageInfo * 0.05 +
  hasMileage * 0.05 +
  hasLocation * 0.05 +
  sourceTrust * 0.05
```

### Source Trust Scores
- copart, iaai: 0.95
- autobidmaster, salvagebid: 0.85-0.90
- bidfax, poctra: 0.70-0.80
- vin_search, google: 0.50-0.60

## Configuration

### Credentials
- Admin: admin@crm.com / admin123
- API: https://a11y-testing.preview.emergentagent.com

### Cache Settings
- VIN Cache TTL: 7 days
- Auto-expire via MongoDB TTL index

## Known Limitations

1. **Real Copart/IAAI Parsing:**
   - Cloudflare захист блокує datacenter proxies
   - Потрібні residential/mobile proxies або API access

2. **Web Search:**
   - Rate limited by search engines
   - Not realtime (cache required)

## Backlog

### P0 (Critical)
- [x] VIN Intelligence Engine
- [x] Pipeline Module
- [x] VIN Search UI

### P1 (High Priority)
- [ ] Residential proxies для Copart/IAAI
- [ ] WebSocket real-time updates
- [ ] Cron jobs для автопарсингу

### P2 (Medium)
- [ ] Public VIN Search landing page (SEO)
- [ ] Client Cabinet
- [ ] Mobile responsive optimization

### P3 (Nice to have)
- [ ] Email notifications
- [ ] Export to CSV/Excel
- [ ] API rate limiting

## Next Steps
1. Додати residential/mobile proxies
2. Налаштувати cron для парсингу кожні 4 години
3. Публічна VIN Search сторінка для SEO
