/**
 * Admin routes.
 * Routes for moderating events/hosts and viewing simple analytics.
 *
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Administrative endpoints
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

import { Router } from 'express';
import {
  getPendingEvents,
  approveEvent,
  rejectEvent,
  getHosts,
  approveHost,
  getAnalytics,
  updateUser,
  removeUser,
  getActiveUsers,
} from '../controllers/adminController.js';
import { getSqlPool, sql } from '../db/sql.js'; // Import your database pool and types

const router = Router();

/**
 * @swagger
 * /api/admin/pending-events:
 *   get:
 *     summary: List events awaiting approval
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending events
 */
router.get('/pending-events', getPendingEvents);

/**
 * @swagger
 * /api/admin/events/{id}/approve:
 *   patch:
 *     summary: Approve an event
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event approved
 */
router.patch('/events/:id/approve', approveEvent);

/**
 * @swagger
 * /api/admin/events/{id}/reject:
 *   patch:
 *     summary: Reject an event
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event rejected
 */
router.patch('/events/:id/reject', rejectEvent);

/**
 * @swagger
 * /api/admin/hosts:
 *   get:
 *     summary: List hosts
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of hosts
 */
router.get('/hosts', getHosts);

/**
 * @swagger
 * /api/admin/hosts/{id}/approve:
 *   patch:
 *     summary: Approve a host
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Host approved
 */
router.patch('/hosts/:id/approve', approveHost);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Basic analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get('/analytics', getAnalytics);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of users
 */
router.get('/users', getActiveUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Name:
 *                 type: string
 *               Email:
 *                 type: string
 *     responses:
 *       204:
 *         description: User updated
 */
router.put('/users/:id', async (req, res) => {
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
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Remove a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: User removed
 */
router.delete('/users/:id', async (req, res) => {
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
});

export default router;