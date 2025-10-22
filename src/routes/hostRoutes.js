import { Router } from 'express';
import { getHostStats, getHostTopEvents, getHostCategoryMix, getHostRsvpTrend, getHostRecentReviews } from '../controllers/hostStatsController.js';

const router = Router();

// GET /api/hosts/:hostUserId/stats
router.get('/:hostUserId/stats', getHostStats);
router.get('/:hostUserId/top-events', getHostTopEvents);
router.get('/:hostUserId/category-mix', getHostCategoryMix);
router.get('/:hostUserId/rsvp-trend', getHostRsvpTrend);
router.get('/:hostUserId/recent-reviews', getHostRecentReviews);

export default router;
