# CRM Auto Business Platform - PRD

## Original Problem Statement
Parser Control Center для CRM автобізнесу (BIBI Cars). Створення admin-панелі для керування парсерами (Copart, IAAI) без технічних знань. 

**Ключові вимоги:**
- Керування парсерами через UI (запустити/зупинити/рестарт)
- Моніторинг здоров'я системи
- Керування проксі серверами
- Перегляд логів та помилок
- Налаштування конфігурації
- Система алертів

## Architecture

### Tech Stack
- **Backend:** NestJS + TypeScript + MongoDB
- **Frontend:** React + Tailwind CSS + Phosphor Icons
- **Database:** MongoDB (парсер стейт, логи, налаштування, алерти)

### User Roles
1. **MASTER_ADMIN** - повний контроль системи та парсерів
2. **MODERATOR** - тільки перегляд статусу (без керування)

## Core Requirements (Static)

### Parser Control Center
- [x] Runners Dashboard (статуси парсерів)
- [x] Health Monitor (стан системи)
- [x] Proxy Manager (керування проксі)
- [x] Logs Viewer (історія запусків)
- [x] Settings Panel (конфігурація)
- [x] Alerts System (сповіщення)

## What's Been Implemented

### Date: 2026-03-26

#### Backend (NestJS)
**New Module: /app/backend/src/modules/ingestion/admin/**

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

#### Frontend (React)
**New Pages:**

1. **ParserControl.js** (`/parser`)
2. **ProxyManager.js** (`/parser/proxies`)
3. **ParserLogs.js** (`/parser/logs`)
4. **ParserSettings.js** (`/parser/settings`)

## Test Results
- Backend: 93.8% passed (15/16 tests)
- Frontend: 100% passed
- Note: Parser run timeout expected without real Copart/IAAI credentials

## Prioritized Backlog

### P0 - Critical
- [x] Parser Control Center UI
- [x] Health Monitoring
- [x] Proxy Management
- [x] Settings Management
- [ ] Real Copart/IAAI API credentials

### P1 - High Priority
- [ ] WebSocket real-time dashboard updates
- [ ] Vehicles UI page (база транспорту)
- [ ] Self-healing automation

### P2 - Medium
- [ ] Public Website з каталогом авто
- [ ] Client Cabinet
- [ ] Reviews module

## Next Tasks
1. Налаштувати реальні Copart/IAAI API credentials
2. Додати WebSocket для live updates на дашборді
3. Реалізувати Vehicles UI page
