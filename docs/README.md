# PUK360 Docs

- Getting Started: `GETTING_STARTED.md`
- Login Flow: `LOGIN.md`
  - Includes role-based routing details and default Student role assignment.
- Events: `EVENTS.md`
- Event Details: `EVENT_DETAILS.md`
- Swagger API Docs: `API_SWAGGER.md`

New/updated docs:
- Hosts (status guard + analytics): `HOSTS.md`
- Admin Host Applications: `ADMIN_HOST_APPLICATIONS.md`
- Admin Users (list/edit/delete, roles, host reactivation): `ADMIN_USERS.md`
- Admin Dashboard + Logs: `ADMIN_DASHBOARD.md` (includes `/api/admin/logs`)
- Database changes summary: `DATABASE_CHANGES.md`

Notes:
- Audit logging is implemented in `src/data/auditRepo.js` and currently logs user registrations and logins. Extend by calling `logEvent()` from other controllers to enrich analytics.
- See `authentication.md` for backend auth details (JWT, hashing).
- Explore `http://localhost:5000/api-docs` for live API documentation.
