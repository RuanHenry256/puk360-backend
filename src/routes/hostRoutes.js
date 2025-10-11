import { Router } from 'express';
import { getHostStats, getHostTopEvents, getHostCategoryMix, getHostRsvpTrend } from '../controllers/hostStatsController.js';

const router = Router();

// GET /api/hosts/:hostUserId/stats
router.get('/:hostUserId/stats', getHostStats);
router.get('/:hostUserId/top-events', getHostTopEvents);
router.get('/:hostUserId/category-mix', getHostCategoryMix);
router.get('/:hostUserId/rsvp-trend', getHostRsvpTrend);

export default router;
