# Admin Dashboard API

Defines the payload consumed by the admin overview in the frontend.

Endpoints
- `GET /api/admin/dashboard` (requires Authorization: Bearer <token> with Admin role)
- `GET /api/admin/logs?limit=500&q=term` — read-only audit log feed for the Admin Logs tab.

Response shape
```json
{
  "engagement": {
    "attendedTotal": 0,
    "attendedThisMonth": 0,
    "avgAttendancePerEvent": 0,
    "activeUsers7d": 0,
    "mostPopularEvent": { "title": "", "attendees": 0 }
  },
  "events": {
    "upcomingCount": 0,
    "cancelledCount": 0,
    "categoryBreakdown": { "Sports": 0, "Academic": 0, "Social": 0 },
    "topVenues": ["Main Hall", "Auditorium", "Library Steps"]
  },
  "users": {
    "newThisMonth": 0,
    "verifiedHosts": 0,
    "pendingHosts": 0,
    "avgHostRating": 0,
    "mostActiveUser": { "name": "", "score": 0 }
  },
  "reviews": {
    "totalReviews": 0,
    "averageRating": 0,
    "mostReviewedEvent": { "title": "", "reviews": 0 },
    "recentSnippets": ["Great energy!", "Too crowded", "Excellent talks"]
  },
  "system": {
    "dbConnected": true,
    "lastBackup": "2025-10-20T12:34:56Z",
    "apiUptimePct": 99.95,
    "storageUsed": "1.2 GB"
  },
  "charts": {
    "eventsPerMonth": [2,5,3,8,6,9,4,7,5,6,8,10],
    "userGrowth": [10,12,15,20,24,28,33,35,40,46,53,60]
  }
}
```

Notes
- The frontend is defensive and will render missing fields as `0`/`—`.
- `events.categoryBreakdown` may be one of:
  - An object map: `{ "Sports": 10, "Academic": 5 }`
  - An array: `[{ "category": "Sports", "count": 10 }, ... ]`
- `events.topVenues` may be an array of strings or objects containing a display name; the UI extracts `name|title|venue`.
- `reviews.recentSnippets` accepts either strings or objects with `text|comment|content` fields.

Data sources (server)
- Dashboard prefers first‑party counts but now augments some values using the audit log when present:
  - New users (This Month): from `dbo.Audit_Log` events of type `user_registered` in the current month, with a fallback to user Created_* date columns.
  - Most active user: prefers the user with the most `user_login` events in the last 30 days; falls back to combined RSVPs + Reviews activity.

Admin Logs
- `GET /api/admin/logs` returns recent entries from `dbo.Audit_Log` joined with the `User` table for name/email.
- Query params:
  - `limit` (default 500, max 5000)
  - `q` (optional search term across event type, target, metadata, user name/email)

Related files
- Frontend consumer: `puk360-frontend/src/pages/AdminMainDash.jsx`
- Audit repository: `puk360-backend/src/data/auditRepo.js`
