# TMS Web App

A small transportation-management web app: load board, driver/truck status
board, driver and truck records, dispatcher directory, and a soft-delete
archive (nothing is ever permanently removed except from the Archive page
itself).

Meant to later integrate with the [TMS late-delivery-risk model](../tms-late-delivery-risk)
— e.g. showing a risk score when a load is created.

## Structure

```
backend/    FastAPI + SQLite + JWT auth
frontend/   React (Vite) single-page app
```

## Running it

**Backend** (from `backend/`):
```powershell
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt
venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
Runs on http://127.0.0.1:8000. A database (`tms.db`) and a default admin
user (`admin` / `admin123`) are created automatically on first run —
**change this password before using this anywhere but your own machine.**

**Frontend** (from `frontend/`):
```powershell
npm install
npm run dev
```
Runs on http://localhost:5173 and expects the backend at 127.0.0.1:8000.

## Current features

- Login (JWT-based), single role model (`admin` / `dispatcher` / `updater`)
- Load Board: list + add loads, assign a driver
- Main Board: read-only live view of every driver's status, truck, location, and active load
- Drivers: list + add, assign a truck
- Trucks: list + add
- Dispatchers: list + add
- Archive: every delete is a soft-delete (`deleted_at`/`deleted_by`); Archive
  page lists deleted records per entity type with **restore** or
  **permanently delete** actions

## Known limitations / not yet built

- No edit UI yet (backend `PUT` endpoints exist, frontend doesn't call them)
- No user management page (the one seeded admin user only)
- No password-change flow
- `TMS_SECRET_KEY` env var should be set explicitly in any real deployment —
  without it a random key is generated per process restart, which invalidates
  all existing login sessions on every restart
- Single SQLite file, not built for concurrent multi-writer production load
