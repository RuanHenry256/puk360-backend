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
  getAnalytics
} from '../controllers/adminController.js';

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

export default router;
