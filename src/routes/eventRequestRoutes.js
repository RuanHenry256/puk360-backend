/**
 * Event Host Request routes.
 * Endpoints for submitting a host request (user) and listing own requests.
 */
import { Router } from 'express';
import {
  submitEventHostRequest,
  getMyEventHostRequests,
} from '../controllers/eventRequestController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Logged-in user submits a request to become a Host
router.post('/', requireAuth, submitEventHostRequest);

// (Optional) Logged-in user can see their own requests
router.get('/mine', requireAuth, getMyEventHostRequests);

export default router;
