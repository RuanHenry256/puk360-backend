/**
 * Review routes.
 * Endpoints for adding, listing, and deleting reviews for events.
 */
import { Router } from 'express';
import {
  addReview,
  getReviews,
  deleteReview
} from '../controllers/reviewController.js';

const router = Router();
router.post('/', addReview);
router.get('/', getReviews);
router.delete('/', deleteReview);

export default router;
