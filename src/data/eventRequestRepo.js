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
