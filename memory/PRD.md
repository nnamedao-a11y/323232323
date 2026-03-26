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
- Vehicles UI page (база транспорту)

## Architecture

### Tech Stack
- **Backend:** NestJS + TypeScript + MongoDB
- **Frontend:** React + Tailwind CSS + Phosphor Icons
- **Database:** MongoDB (парсер стейт, логи, налаштування, алерти, vehicles)

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

### Vehicles Module
- [x] Vehicles List with filters
- [x] Vehicle Cards with images, prices, VIN
- [x] Vehicle Details Modal
- [x] Create Lead from Vehicle
- [x] Statistics Dashboard

## What's Been Implemented

### Date: 2026-03-26

#### Backend (NestJS)

**Module: /app/backend/src/modules/ingestion/admin/**
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

**Module: /app/backend/src/modules/ingestion/**
- `VehiclesController` - vehicles API endpoints
- `VehicleService` - CRUD operations for vehicles
- `Vehicle Schema` - normalized vehicle model

**Vehicles API Endpoints:**
- GET /api/vehicles - list with pagination & filters
- GET /api/vehicles/stats - statistics
- GET /api/vehicles/makes - makes list
- GET /api/vehicles/:id - vehicle details
- POST /api/vehicles/:id/create-lead - create lead from vehicle ✅ FIXED

#### Frontend (React)

**Parser Control Pages:**
1. **ParserControl.js** (`/parser`)
2. **ProxyManager.js** (`/parser/proxies`)
3. **ParserLogs.js** (`/parser/logs`)
4. **ParserSettings.js** (`/parser/settings`)

**Vehicles Pages:**
5. **Vehicles.js** (`/vehicles`) - Full vehicle management UI

## Bug Fixes

### Date: 2026-03-26
**Issue:** POST /api/vehicles/:id/create-lead returning 500 error

**Root Cause:**
1. `LeadSource` enum missing `VEHICLE_COPART` and `VEHICLE_IAAI` values
2. `email` field in Lead schema was required but passed as optional
3. Test vehicles missing `externalId` field

**Fix Applied:**
1. Added `VEHICLE_COPART = 'vehicle_copart'` and `VEHICLE_IAAI = 'vehicle_iaai'` to LeadSource enum
2. Made email optional in Lead schema: `email?: string`
3. Updated vehicles controller to use proper enum values
4. Added externalId to test vehicles

**Files Modified:**
- `/app/backend/src/shared/enums/index.ts`
- `/app/backend/src/modules/leads/lead.schema.ts`
- `/app/backend/src/modules/ingestion/controllers/vehicles.controller.ts`

## Test Results
- Backend: 100% passed
- Frontend: 80% (session management improvement applied)
- Create Lead: ✅ Working

## Prioritized Backlog

### P0 - Critical
- [x] Parser Control Center UI
- [x] Health Monitoring
- [x] Proxy Management
- [x] Settings Management
- [x] Vehicles UI page
- [x] Create Lead from Vehicle
- [ ] Real Copart/IAAI API credentials

### P1 - High Priority
- [ ] WebSocket real-time dashboard updates
- [ ] Self-healing automation
- [ ] VIN Search public page

### P2 - Medium
- [ ] Public Website з каталогом авто
- [ ] Client Cabinet
- [ ] Reviews module

## Next Tasks
1. Налаштувати реальні Copart/IAAI API credentials
2. Додати WebSocket для live updates на дашборді
3. Реалізувати VIN Search для SEO та конверсії
4. Public site з каталогом авто для продажів
