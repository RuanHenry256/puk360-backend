import { getSqlPool, sql } from '../db/sql.js';

export async function requireActiveHost(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const pool = await getSqlPool();
    const result = await pool
      .request()
      .input('uid', sql.Int, userId)
      .query(`SELECT TOP 1 Is_Active, Approval_Status, Activity_Status FROM dbo.Host_Profile WHERE User_ID = @uid`);

    const row = result.recordset?.[0];
    const isActive = !!(row && (row.Is_Active === 1));
    if (!isActive) {
      return res.status(403).json({
        error: 'Host account is not active',
        details: row || null,
      });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Failed to verify host status', details: e.message });
  }
}

