# CRM Auto Business Platform (BIBI Cars) - PRD

## Original Problem Statement
Parser Control Center для CRM автобізнесу (BIBI Cars). Створення admin-панелі для керування парсерами (Copart, IAAI) без технічних знань. 

**Ключові вимоги:**
- Керування парсерами через UI (запустити/зупинити/рестарт)
- Моніторинг здоров'я системи
- Керування проксі серверами
- Перегляд логів та помилок
- Налаштування конфігурації
- Система алертів
- Vehicles UI page (база транспорту)

## Architecture

### Tech Stack
- **Backend:** NestJS + TypeScript + MongoDB
- **Frontend:** React + Tailwind CSS + Phosphor Icons
- **Database:** MongoDB (parser state, logs, settings, alerts, vehicles, proxies)
- **Browser Automation:** Puppeteer + Playwright (chromium-1208)

### User Roles
1. **MASTER_ADMIN** - повний контроль системи та парсерів
2. **MODERATOR** - тільки перегляд статусу (без керування)

## What's Been Implemented (Date: 2026-03-27)

### Backend (NestJS)

#### Parser Admin Module (`/app/backend/src/modules/ingestion/admin/`)
1. **Schemas:**
   - `ParserState` - стан парсера (status, lastRunAt, stats)
   - `ParserLog` - логи запусків та помилок
   - `ParserSetting` - налаштування парсера
   - `ParserAlert` - системні алерти

2. **Services:**
   - `ParserAdminService` - головний orchestration service
   - `ParserControlService` - керування парсерами (run/stop/restart)
   - `ParserHealthAdminService` - health monitoring
   - `ParserLogsService` - логування
   - `ParserAlertsService` - система алертів
   - `ProxyAdminService` - керування проксі

3. **Controllers:**
   - `ParserAdminController` - основні endpoints
   - `ProxyAdminController` - proxy management

4. **API Endpoints:**
   - Parser Control: run, stop, resume, restart, run-all, stop-all
   - Health: overview, source-specific
   - Logs: with filters and pagination
   - Settings: get/update per source
   - Alerts: list, resolve
   - Proxies: CRUD + test

#### Ingestion Module (`/app/backend/src/modules/ingestion/`)
- `CopartRunner` - парсер для Copart з XHR interception
- `IAAIRunner` - парсер для IAAI
- `VehicleService` - CRUD операції для vehicles
- `UniversalScraper` - браузерний скрапер з проксі підтримкою

#### Antiblock System (`/app/backend/src/modules/ingestion/antiblock/`)
- `CircuitBreakerService` - захист від hammering
- `ParserHealthService` - моніторинг здоров'я
- `ParserGuardService` - orchestration для безпечного парсингу
- `HttpFingerprintService` - ротація fingerprints
- `EnhancedProxyPoolService` - failover proxy pool з MongoDB persistence

### Frontend (React)

#### Pages:
- **ParserControl.js** (`/parser`) - керування парсерами
- **ProxyManager.js** (`/parser/proxies`) - керування проксі
- **ParserLogs.js** (`/parser/logs`) - логи
- **ParserSettings.js** (`/parser/settings`) - налаштування
- **Vehicles.js** (`/vehicles`) - база авто з карточками, фільтрами, статистикою

### Test Results (2026-03-27)
- Backend: 100% passed (10 API endpoints)
- Frontend: 100% passed (login, dashboard, vehicles, parser control)

## Configuration Notes

### Proxy Setup
- Проксі зберігаються в MongoDB collection `system_proxies`
- Підтримка authentication (username:password)
- Priority-based failover (не rotation)
- Automatic cooldown при помилках

### Browser Path
```
/pw-browsers/chromium-1208/chrome-linux/chrome
```

### Credentials
- Admin: admin@crm.com / admin123
- API URL: https://a11y-testing.preview.emergentagent.com

## Known Limitations

1. **Copart/IAAI Parsing:**
   - Cloudflare захист блокує браузерний скрапінг
   - Потрібні residential proxies або official API access
   - Тестові дані для vehicles заповнені вручну

2. **Proxy Requirements:**
   - Datacenter проксі блокуються Cloudflare
   - Рекомендовано: residential/mobile proxies
   - Мінімум 5-10 проксі для стабільної роботи

## P0 - Critical (Implemented)
- [x] Parser Control Center UI
- [x] Health Monitoring
- [x] Proxy Management з MongoDB persistence
- [x] Settings Management
- [x] Vehicles UI page
- [x] Create Lead from Vehicle
- [x] Browser automation з proxy support

## P1 - High Priority (Backlog)
- [ ] Real Copart/IAAI API credentials або residential proxies
- [ ] WebSocket real-time dashboard updates
- [ ] Self-healing automation

## P2 - Medium (Backlog)
- [ ] VIN Search public page
- [ ] Public Website з каталогом авто
- [ ] Client Cabinet
- [ ] Reviews module

## Next Steps
1. Отримати residential/mobile проксі для обходу Cloudflare
2. Або отримати official API access до Copart/IAAI
3. Налаштувати cron jobs для автоматичного парсингу
4. Додати WebSocket для live updates
