import { Router } from 'express';
import {
  addReview,
  getReviews,
  deleteReview
} from '../controllers/reviewController.js';

const router = Router();
router.post('/:id/reviews', addReview);
router.get('/:id/reviews', getReviews);
router.delete('/:id', deleteReview);

export default router;
