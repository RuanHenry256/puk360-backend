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
  listHostApplications,
  reviewHostApp,
  listUsers,
  listRoles,
  updateUser,
  deleteUser,
  getUser,
  reactivateHostAccount,
} from '../controllers/adminController.js';
import { requireAuth } from '../middleware/auth.js';
import { getDashboardMetrics } from '../controllers/adminDashboardController.js';
import { listAuditLogs } from '../controllers/adminController.js';

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
router.get('/pending-events', requireAuth, getPendingEvents);
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
router.patch('/events/:id/approve', requireAuth, approveEvent);
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
router.patch('/events/:id/reject', requireAuth, rejectEvent);
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
router.get('/hosts', requireAuth, getHosts);
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
router.patch('/hosts/:id/approve', requireAuth, approveHost);
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
router.get('/analytics', requireAuth, getAnalytics);
/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Admin overview metrics
 *     description: Returns engagement, events analytics, user insights, reviews, system stats, and chart data used by the Admin dashboard.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics payload
 */
router.get('/dashboard', requireAuth, getDashboardMetrics);
/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: List audit logs
 *     description: Read-only feed of recent audit events (e.g., user_registered, user_login). Supports basic search.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 500
 *         description: Max rows to return (max 5000)
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term across eventType/target/metadata/user
 *     responses:
 *       200:
 *         description: Array of logs
 */
router.get('/logs', requireAuth, listAuditLogs);

// Host applications moderation
/**
 * @swagger
 * /api/admin/host-applications:
 *   get:
 *     summary: List host applications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [All, Pending, Approved, Rejected]
 *         description: Filter by status (default Pending in UI)
 *     responses:
 *       200:
 *         description: Application list
 */
router.get('/host-applications', requireAuth, listHostApplications);
/**
 * @swagger
 * /api/admin/host-applications/{id}:
 *   patch:
 *     summary: Review a host application
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
 *             required: [decision]
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review saved
 */
router.patch('/host-applications/:id', requireAuth, reviewHostApp);

// Users management
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: User list
 */
router.get('/users', requireAuth, listUsers);
/**
 * @swagger
 * /api/admin/roles:
 *   get:
 *     summary: List roles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role list
 */
router.get('/roles', requireAuth, listRoles);
/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a user (with roles and host status)
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
 *         description: User details
 */
router.get('/users/:id', requireAuth, getUser);
/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update a user (name/email/roles/password)
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
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               roles:
 *                 type: array
 *                 items:
 *                   oneOf:
 *                     - type: integer
 *                     - type: string
 *               password:
 *                 type: string
 *                 description: Optional new password (min 6 chars)
 *     responses:
 *       200:
 *         description: Updated user
 */
router.patch('/users/:id', requireAuth, updateUser);
/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
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
 *         description: Deletion result
 */
router.delete('/users/:id', requireAuth, deleteUser);
/**
 * @swagger
 * /api/admin/hosts/{id}/reactivate:
 *   post:
 *     summary: Reactivate a host account for a user
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
 *         description: Host status
 */
router.post('/hosts/:id/reactivate', requireAuth, reactivateHostAccount);

export default router;
