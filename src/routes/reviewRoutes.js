/**
 * Review routes.
 * Endpoints for adding, listing, and deleting reviews for events.
 *
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Event reviews
 * components:
 *   schemas:
 *     ReviewInput:
 *       type: object
 *       required:
 *         - rating
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *       example:
 *         rating: 5
 *         comment: "Great event!"
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         eventId:
 *           type: integer
 *         rating:
 *           type: integer
 *         comment:
 *           type: string
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  addReview,
  getReviews,
  deleteReview
} from '../controllers/reviewController.js';

const router = Router();
/**
 * @swagger
 * /api/{id}/reviews:
 *   post:
 *     summary: Add a review for an event
 *     description: Adds a review to the event specified by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 */
router.post('/events/:id/reviews', requireAuth, addReview);
/**
 * @swagger
 * /api/{id}/reviews:
 *   get:
 *     summary: Get reviews for an event
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Array of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 */
router.get('/events/:id/reviews', getReviews);
/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete('/reviews/:id', requireAuth, deleteReview);

export default router;
