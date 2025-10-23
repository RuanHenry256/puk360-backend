# Getting Started

This repository contains a React frontend and a Node.js/Express backend for PUK360. Use this guide to set up a working local environment and understand how the parts fit together.

---

## Overview

- Frontend: `puk360-frontend/` (React + Tailwind)
- Backend: `puk360-backend/` (Express + Sequelize + SQL Server/Azure SQL)
- API Docs (Swagger): served by the backend at `/api-docs`

---

## Prerequisites

- Node.js 18+ and npm
- SQL Server or Azure SQL (unless running in no-DB demo mode)
- A JWT secret for signing tokens

Optional for quick API demos:
- Set `SKIP_DB=1` when starting the backend to run without a database (helpful for checking `/api-docs` and basic wiring).

---

## Backend Setup

1) Configure environment
- Copy `puk360-backend/env.example` to `.env` and fill values:
  - Database: either a single `AZURE_SQL_CONNECTION_STRING` or discrete `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`.
  - Auth: `JWT_SECRET` (required)
  - CORS: `CORS_ORIGIN` (defaults to `http://localhost:3000`)
  - Uploads: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION=ap-south-1`, `S3_BUCKET=puk360-posters-ap-south-1`

2) Install dependencies
- In `puk360-backend/` run: `npm ci` (or `npm install`)

3) Start the server
- Development: `npm run dev` (requires `nodemon` if you add it)
- Regular: `npm start`

4) Verify health and docs
- Health check: `GET http://localhost:5000/api/health`
- Swagger UI: `http://localhost:5000/api-docs`
- Diagnostic route (temporary): `GET /api/diag/auth-check` (see `puk360-backend/src/server.js`)

5) Optional: seed example events
- Seeder: `puk360-backend/src/seeders/seed-event.cjs`
- You can run it via Node, ensuring your DB env is set. Example: `node src/seeders/seed-event.cjs`

---

## Frontend Setup

1) Point frontend to the backend
- Create `puk360-frontend/.env` with:
  - `REACT_APP_API_URL=http://localhost:5000`

2) Install dependencies
- In `puk360-frontend/` run: `npm ci` (or `npm install`)

3) Start the dev server
- `npm start` then open `http://localhost:3000`

---

## Local Development Flow

- Start backend first so the frontend can resolve API calls.
- For protected backend endpoints, the frontend stores a JWT in `localStorage` after login/registration and attaches it as `Authorization: Bearer <token>`.
- Edit backend controllers/routes under `puk360-backend/src/` and React pages/components under `puk360-frontend/src/`.

---

## Key Entry Points

- Backend server: `puk360-backend/src/server.js`
- Auth endpoints: `puk360-backend/src/routes/authRoutes.js`, `puk360-backend/src/controllers/authController.js`
- Events endpoints: `puk360-backend/src/routes/eventRoutes.js`, `puk360-backend/src/controllers/eventController.js`
- RSVP endpoints: `puk360-backend/src/routes/rsvpRoutes.js`, `puk360-backend/src/controllers/rsvpController.js`
- Frontend boot: `puk360-frontend/src/index.js`, `puk360-frontend/src/App.js`
- Frontend API client: `puk360-frontend/src/api/client.js`

---

## Tips

- CORS: If the frontend runs on a different port than `CORS_ORIGIN`, update it in the backend env.
- No-DB mode: During early UI work, set `SKIP_DB=1` before `npm start` in the backend to bypass DB connection.
- API exploration: Use Swagger at `/api-docs` for request/response shapes and quick testing.

---

## New in this iteration

- Host guard middleware (`requireActiveHost`) restricts event creation/updates/deletes to active hosts (see `src/middleware/hostGuard.js`).
- Host analytics endpoints under `/api/hosts/:id/...` (stats, top-events, category-mix, rsvp-trend).
- Admin host applications endpoints under `/api/admin/host-applications` (list + review with decision/comment) that update `Host_Profile` and assign the Host role.
- Poster uploads: `POST /api/poster/presign` returns S3 presigned PUT; event creation now requires `ImageUrl` in our bucket.

