/**
 * Admin controller.
 * Stubs for reviewing events/hosts and returning simple analytics.
 */

import { getSqlPool } from '../db/sql.js'; // Import the getSqlPool function

export const getPendingEvents = (req, res) => {
  res.json([{ id: 1, title: "Pending Event", status: "pending" }]);
};

export const approveEvent = (req, res) => {
  res.json({ message: "Event approved", id: req.params.id });
};

export const rejectEvent = (req, res) => {
  res.json({ message: "Event rejected", id: req.params.id });
};

export const getHosts = (req, res) => {
  res.json([{ id: 1, name: "Jane Doe", status: "pending" }]);
};

export const approveHost = (req, res) => {
  res.json({ message: "Host approved", id: req.params.id });
};

export const getAnalytics = (req, res) => {
  res.json({ totalEvents: 42, totalStudents: 300 });
};

/**
 * Fetches all users from the dbo.User table.
 */
export const getActiveUsers = async (req, res) => {
  try {
    const pool = await getSqlPool(); // Get the SQL connection pool
    const result = await pool.request().query(`
      SELECT User_ID, Name, Email 
      FROM [User] 
      WHERE Status = 'Active'
    `); // Query to fetch active users
    console.log(result.recordset); // Log the users data
    res.json(result.recordset); // Return the result set
  } catch (error) {
    console.error('Error fetching active users:', error.message); // Log detailed error
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
};

// Update user details
export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const { Name, Email } = req.body;

  try {
    const pool = await getSqlPool();
    await pool.request()
      .input('User_ID', sql.Int, userId)
      .input('Name', sql.NVarChar(100), Name)
      .input('Email', sql.NVarChar(100), Email)
      .query(`
        UPDATE [User]
        SET Name = @Name, Email = @Email
        WHERE User_ID = @User_ID
      `);
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Remove user
export const removeUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const pool = await getSqlPool();
    await pool.request()
      .input('User_ID', sql.Int, userId)
      .query(`
        DELETE FROM [User]
        WHERE User_ID = @User_ID
      `);
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).send('Internal Server Error');
  }
};