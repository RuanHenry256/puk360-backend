/**
 * Host application data-access using MSSQL pool.
 */
import { getSqlPool, sql } from "../db/sql.js";

/**
 * Insert a new host application into Host_Applications and return its ID.
 * Persist only the user's motivation in the Motivation column.
 * Org_Name and Event_Type are stored in their dedicated columns.
 */
export async function insertHostApplication({ applicantUserId, orgName, eventType, motivation }) {
  const pool = await getSqlPool();

  // Only store the user's motivation in Motivation column (Org and Event Type have dedicated columns)
  const motivationOnly = motivation ?? '';

  const result = await pool
    .request()
    .input("Applicant_User_ID", sql.Int, applicantUserId)
    .input("Motivation", sql.NVarChar(sql.MAX), motivationOnly)
    .input("Status", sql.NVarChar(50), "Pending")
    .input("Org_Name", sql.NVarChar(255), orgName)
    .input("Event_Type", sql.NVarChar(255), eventType)
    .query(`
      INSERT INTO Host_Applications (Applicant_User_ID, Motivation, Status, Org_Name, Event_Type)
      OUTPUT INSERTED.Application_ID AS Application_ID
      VALUES (@Applicant_User_ID, @Motivation, @Status, @Org_Name, @Event_Type);
    `);

  return result.recordset[0]?.Application_ID;
}

/** Fetch the current user's host applications (most recent first). */
export async function selectHostApplicationsByUser(userId) {
  const pool = await getSqlPool();
  const result = await pool
    .request()
    .input("Applicant_User_ID", sql.Int, userId)
    .query(`
      SELECT 
        Application_ID,
        Applicant_User_ID,
        Motivation,
        Application_Date,
        -- Convenience: local time for SA users (UTC+02:00)
        (CAST(Application_Date AS datetime2) AT TIME ZONE 'UTC') AT TIME ZONE 'South Africa Standard Time' AS Application_Date_SAST,
        Status,
        Review_Comment,
        Reviewers_User_ID,
        Org_Name,
        Event_Type
      FROM Host_Applications
      WHERE Applicant_User_ID = @Applicant_User_ID
      ORDER BY Application_Date DESC, Application_ID DESC;
    `);
  return result.recordset || [];
}

/** Admin: list host applications (optionally by status). */
export async function selectAllHostApplications(status = null) {
  const pool = await getSqlPool();
  const req = pool.request();
  let where = '';
  if (status && status.toLowerCase() !== 'all') {
    req.input('Status', sql.NVarChar(50), status);
    where = 'WHERE HA.Status = @Status';
  }
  const result = await req.query(`
      SELECT 
        HA.Application_ID,
        HA.Applicant_User_ID,
        U.Name AS Applicant_Name,
        U.Email AS Applicant_Email,
        HA.Motivation,
        HA.Application_Date,
        (CAST(HA.Application_Date AS datetime2) AT TIME ZONE 'UTC') AT TIME ZONE 'South Africa Standard Time' AS Application_Date_SAST,
        HA.Status,
        HA.Review_Comment,
        HA.Reviewers_User_ID,
        HA.Org_Name,
        HA.Event_Type
      FROM Host_Applications HA
      LEFT JOIN [User] U ON U.User_ID = HA.Applicant_User_ID
      ${where}
      ORDER BY HA.Application_Date DESC, HA.Application_ID DESC;
  `);
  return result.recordset || [];
}

/** Admin: review an application. On APPROVED, ensure Host role + activate Host_Profile. */
export async function reviewHostApplication({ applicationId, reviewerUserId, decision, comment }) {
  const pool = await getSqlPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    const req = new sql.Request(tx);
    req.input('Application_ID', sql.Int, applicationId);
    const appRes = await req.query(`SELECT TOP 1 * FROM Host_Applications WHERE Application_ID = @Application_ID`);
    const app = appRes.recordset?.[0];
    if (!app) throw new Error('Application not found');

    const normalizedDecision = String(decision || '').toUpperCase();
    const finalStatus = normalizedDecision === 'APPROVED' ? 'Approved' : normalizedDecision === 'REJECTED' ? 'Rejected' : null;
    if (!finalStatus) throw new Error('Invalid decision');

    // If status is already the desired one, treat as no-op to avoid duplicate side effects/logs
    const currentStatus = String(app.Status || '').toUpperCase();
    let changed = true;
    if (currentStatus === String(finalStatus).toUpperCase()) {
      changed = false;
    } else {
      // Update application row
      const up = new sql.Request(tx);
      up
        .input('Status', sql.NVarChar(50), finalStatus)
        .input('Review_Comment', sql.NVarChar(sql.MAX), comment || null)
        .input('Reviewers_User_ID', sql.Int, reviewerUserId || null)
        .input('Application_ID', sql.Int, applicationId);
      await up.query(`
        UPDATE Host_Applications
        SET Status = @Status,
            Review_Comment = @Review_Comment,
            Reviewers_User_ID = @Reviewers_User_ID
        WHERE Application_ID = @Application_ID;
      `);

      // On approval: ensure Host role + activate Host_Profile
      if (finalStatus === 'Approved') {
        const applicantId = app.Applicant_User_ID;

        // Ensure Host role mapping
        const roleReq = new sql.Request(tx);
        const roleRes = await roleReq.query(`SELECT Role_ID FROM Roles WHERE Role_Name = 'Host'`);
        const hostRoleId = roleRes.recordset?.[0]?.Role_ID || 2; // fallback to 2
        const ensureReq = new sql.Request(tx);
        ensureReq.input('uid', sql.Int, applicantId).input('rid', sql.Int, hostRoleId);
        await ensureReq.query(`
          IF NOT EXISTS (SELECT 1 FROM UserRoles WHERE User_ID = @uid AND Role_ID = @rid)
            INSERT INTO UserRoles (User_ID, Role_ID) VALUES (@uid, @rid);
        `);

        // Activate Host_Profile (insert if missing)
        const hpReq = new sql.Request(tx);
        hpReq.input('uid', sql.Int, applicantId);
        const hpRes = await hpReq.query(`SELECT TOP 1 * FROM Host_Profile WHERE User_ID = @uid`);
        if (hpRes.recordset.length === 0) {
          const ins = new sql.Request(tx);
          ins.input('uid', sql.Int, applicantId);
          await ins.query(`
            INSERT INTO Host_Profile (User_ID, Approval_Status, Activity_Status)
            VALUES (@uid, 'Approved', 'Active');
          `);
        } else {
          const upd = new sql.Request(tx);
          upd.input('uid', sql.Int, applicantId);
          await upd.query(`
            UPDATE Host_Profile SET Approval_Status='Approved', Activity_Status='Active' WHERE User_ID=@uid;
          `);
        }
      }
    }

    await tx.commit();
    return { ok: true, changed };
  } catch (e) {
    try { await tx.rollback(); } catch {}
    throw e;
  }
}
