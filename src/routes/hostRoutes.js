import { Router } from 'express';
import { getHostStats, getHostTopEvents, getHostCategoryMix, getHostRsvpTrend, getHostRecentReviews } from '../controllers/hostStatsController.js';

/**
 * @swagger
 * tags:
 *   - name: Hosts
 *     description: Host analytics endpoints used by the Host dashboard
 */

const router = Router();

/**
 * @swagger
 * /api/hosts/{hostUserId}/stats:
 *   get:
 *     summary: Host summary stats
 *     tags: [Hosts]
 *     parameters:
 *       - in: path
 *         name: hostUserId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Stats payload
 */
router.get('/:hostUserId/stats', getHostStats);
/**
 * @swagger
 * /api/hosts/{hostUserId}/top-events:
 *   get:
 *     summary: Top events by metric
 *     tags: [Hosts]
 *     parameters:
 *       - in: path
 *         name: hostUserId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [rsvps, reviews]
 *         description: Metric to rank by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 2
 *     responses:
 *       200:
 *         description: Array of top events
 */
router.get('/:hostUserId/top-events', getHostTopEvents);
/**
 * @swagger
 * /api/hosts/{hostUserId}/category-mix:
 *   get:
 *     summary: Event category breakdown for a host
 *     tags: [Hosts]
 *     parameters:
 *       - in: path
 *         name: hostUserId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category mix
 */
router.get('/:hostUserId/category-mix', getHostCategoryMix);
/**
 * @swagger
 * /api/hosts/{hostUserId}/rsvp-trend:
 *   get:
 *     summary: RSVP trend over time
 *     tags: [Hosts]
 *     parameters:
 *       - in: path
 *         name: hostUserId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Trend series
 */
router.get('/:hostUserId/rsvp-trend', getHostRsvpTrend);
/**
 * @swagger
 * /api/hosts/{hostUserId}/recent-reviews:
 *   get:
 *     summary: Recent reviews for a host’s events
 *     tags: [Hosts]
 *     parameters:
 *       - in: path
 *         name: hostUserId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Recent reviews
 */
router.get('/:hostUserId/recent-reviews', getHostRecentReviews);

export default router;
