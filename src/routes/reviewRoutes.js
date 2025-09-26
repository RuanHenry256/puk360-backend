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
router.post('/postreview', addReview);
router.get('/:id/review', getReviews);
router.delete('/:id', deleteReview);

export default router;
