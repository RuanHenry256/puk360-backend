/**
 * Event Host Request routes.
 * Endpoints for submitting a host request (user) and listing own requests.
 *
 * @swagger
 * tags:
 *   - name: Host Applications
 *     description: Request to become an event host
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     HostApplicationRequest:
 *       type: object
 *       required:
 *         - org_name
 *         - motivation
 *       properties:
 *         org_name:
 *           type: string
 *           description: Organization or society name
 *         event_category:
 *           type: string
 *           description: Category of events (optional)
 *         motivation:
 *           type: string
 *           description: Why you should be approved as a host
 *       example:
 *         org_name: PUK Tech Society
 *         event_category: Technology
 *         motivation: We host inclusive tech meetups for students.
 *     HostApplicationCreated:
 *       type: object
 *       properties:
 *         application_id:
 *           type: integer
 *         status:
 *           type: string
 *           example: PENDING
 */
import { Router } from 'express';
import {
  submitEventHostRequest,
  getMyEventHostRequests,
} from '../controllers/eventRequestController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Logged-in user submits a request to become a Host
/**
 * @swagger
 * /api/host-applications:
 *   post:
 *     summary: Submit a request to become an event host
 *     tags: [Host Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HostApplicationRequest'
 *     responses:
 *       201:
 *         description: Host application created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HostApplicationCreated'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, submitEventHostRequest);

// (Optional) Logged-in user can see their own requests
/**
 * @swagger
 * /api/host-applications/mine:
 *   get:
 *     summary: List host applications submitted by the current user
 *     tags: [Host Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of host applications
 *       401:
 *         description: Unauthorized
 */
router.get('/mine', requireAuth, getMyEventHostRequests);

export default router;
