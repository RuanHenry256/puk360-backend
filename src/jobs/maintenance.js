// src/jobs/maintenance.js
// Nightly/periodic maintenance tasks: auto-complete past events

import sequelize from '../config/db.js';
import { logEvent } from '../data/auditRepo.js';

async function sweepEventsToCompleted() {
  try {
    const sql = `
      DECLARE @now datetime2 = SYSDATETIME();
      ;WITH due AS (
        SELECT E.Event_ID, E.Title
        FROM [Event] E
        WHERE ISNULL(E.Status,'Scheduled') NOT IN ('Cancelled','Completed')
          AND TRY_CONVERT(datetime2,
              CONCAT(CONVERT(varchar(10), E.[Date], 23),' ',
                     ISNULL(CONVERT(varchar(5), E.[endTime], 108),'23:59'))
          ) < @now
      )
      UPDATE E
      SET Status = 'Completed'
      OUTPUT INSERTED.Event_ID AS id, INSERTED.Title AS title
      FROM [Event] E
      INNER JOIN due d ON d.Event_ID = E.Event_ID;`;

    const [rows] = await sequelize.query(sql);
    const updated = Array.isArray(rows) ? rows : [];
    for (const r of updated) {
      try {
        await logEvent({ eventType: 'event_completed', userId: null, targetType: 'event', targetId: r.id, metadata: { reason: 'auto_sweep' } });
      } catch { /* ignore logging failures */ }
    }
    return updated.length;
  } catch (e) {
    // Don't throw: background task should be non-fatal
    // eslint-disable-next-line no-console
    console.error('[maintenance] sweepEventsToCompleted failed:', e?.message || e);
    return 0;
  }
}

export function startMaintenanceJobs() {
  const intervalMs = Number(process.env.MAINTENANCE_SWEEP_INTERVAL_MS || 1000 * 60 * 60); // default 1h
  // Initial delayed run (to avoid startup thundering herd)
  setTimeout(() => { sweepEventsToCompleted(); }, 10_000);
  setInterval(() => { sweepEventsToCompleted(); }, Math.max(5 * 60 * 1000, intervalMs));
}

export default startMaintenanceJobs;

