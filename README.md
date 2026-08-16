# TMS Web App

A small transportation-management web app: load board, driver/truck status
board, driver and truck records, dispatcher directory, admin-only user
management, and a soft-delete archive (nothing is ever permanently removed
except from the Archive page itself).

Meant to later integrate with the [TMS late-delivery-risk model](../tms-late-delivery-risk)
— e.g. showing a risk score when a load is created.

## Structure

```
backend/    FastAPI + SQLAlchemy (SQLite locally, Postgres in production) + JWT auth
frontend/   React (Vite) single-page app
```

## Running it locally

**Backend** (from `backend/`):
```powershell
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt
venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
Runs on http://127.0.0.1:8000. With no `DATABASE_URL` set, it uses a local
SQLite file (`backend/tms.db`) — nothing extra to install. A default admin
user (`admin` / `admin123`) is seeded automatically on first run.

**Frontend** (from `frontend/`):
```powershell
npm install
npm run dev
```
Runs on http://localhost:5173 and talks to `http://127.0.0.1:8000` by
default (override with a `VITE_API_BASE_URL` env var — see `.env.example`).

## Current features

- Login (JWT-based), roles: `admin` / `dispatcher` / `updater`
- Load Board: full column set (driver, truck, dates, route, miles, rate,
  broker, statuses, dispatcher, document indicators), add/edit, click a
  status pill to change it, click load # or driver name to open its detail page
- Main Board: live view of every driver's status, truck, location, and active load
- Drivers / Trucks / Dispatchers: list, add, edit
- Driver detail page: documents (upload), loads, expenses/deductions/debt/
  additional pay/statements, notes, a weekly status-history calendar, and an
  audit log
- Load detail page: documents, notes, audit log
- Archive: every delete is a soft-delete (`deleted_at`/`deleted_by`); Archive
  page lists deleted records per entity type with **restore** or
  **permanently delete** actions
- Admin-only Users page: list/add/deactivate accounts
- Profile page with a change-password form
- Light/dark theme toggle

## Deploying (free tier: Neon + Render + Vercel)

1. **Database — [Neon](https://neon.tech)**: create a free Postgres project,
   copy its connection string (`postgresql://...`).
2. **Backend — [Render](https://render.com)**: new Web Service from this
   repo, root directory `backend` (or use the included `render.yaml`
   blueprint). Set these environment variables:
   - `DATABASE_URL` — the Neon connection string
   - `TMS_SECRET_KEY` — any long random string (Render can auto-generate one)
   - `TMS_ADMIN_USERNAME` / `TMS_ADMIN_PASSWORD` — **change from the defaults**
   - `CORS_ORIGINS` — your Vercel frontend URL, once you have it
3. **Frontend — [Vercel](https://vercel.com)**: new project from this repo,
   root directory `frontend`. Set `VITE_API_BASE_URL` to your Render backend
   URL. The included `vercel.json` handles client-side routing so refreshing
   a page like `/drivers/12` doesn't 404.

Note: pushing this repo to GitHub only syncs code. The database lives on
Neon (or wherever `DATABASE_URL` points), not in git — that's intentional,
it's how the data stays the same whether you're accessing it from one
machine or another.

## Known limitations / not yet built

- No user-editing (only add/deactivate) on the Users page
- `TMS_SECRET_KEY` must be set explicitly in any real deployment — without
  it a random key is generated per process restart, invalidating all
  existing login sessions on every restart
- No fine-grained permissions beyond the three roles
