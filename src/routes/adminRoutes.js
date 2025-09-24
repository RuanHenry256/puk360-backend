/**
 * Admin routes.
 * Routes for moderating events/hosts and viewing simple analytics.
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
router.get('/pending-events', getPendingEvents);
router.patch('/events/:id/approve', approveEvent);
router.patch('/events/:id/reject', rejectEvent);
router.get('/hosts', getHosts);
router.patch('/hosts/:id/approve', approveHost);
router.get('/analytics', getAnalytics);

export default router;
