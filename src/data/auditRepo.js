// src/data/auditRepo.js
import { getSqlPool, sql } from '../db/sql.js';

export async function ensureAuditTable() {
  const pool = await getSqlPool();
  await pool.request().query(`
    IF OBJECT_ID('dbo.Audit_Log','U') IS NULL
    BEGIN
      CREATE TABLE dbo.Audit_Log (
        Log_ID       INT IDENTITY(1,1) PRIMARY KEY,
        Event_Type   NVARCHAR(64) NOT NULL,
        User_ID      INT NULL,
        Target_Type  NVARCHAR(64) NULL,
        Target_ID    INT NULL,
        Metadata     NVARCHAR(MAX) NULL,
        Created_At   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
      CREATE INDEX IX_Audit_Log_Type_Time ON dbo.Audit_Log (Event_Type, Created_At);
      CREATE INDEX IX_Audit_Log_User_Time ON dbo.Audit_Log (User_ID, Created_At);
    END
  `);
}

export async function logEvent({ eventType, userId = null, targetType = null, targetId = null, metadata = null }) {
  try {
    await ensureAuditTable();
    const pool = await getSqlPool();
    await pool
      .request()
      .input('type', sql.NVarChar(64), eventType)
      .input('uid', sql.Int, userId)
      .input('tt', sql.NVarChar(64), targetType)
      .input('tid', sql.Int, targetId)
      .input('meta', sql.NVarChar(sql.MAX), metadata ? JSON.stringify(metadata).slice(0, 8000) : null)
      .query(`INSERT INTO dbo.Audit_Log (Event_Type, User_ID, Target_Type, Target_ID, Metadata) VALUES (@type, @uid, @tt, @tid, @meta)`);
  } catch {
    // never throw: logging must be fire-and-forget
  }
}

