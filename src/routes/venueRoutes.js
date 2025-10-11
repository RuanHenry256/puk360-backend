import { Router } from 'express';
import { getAllVenues } from '../controllers/venueController.js';

const router = Router();

router.get('/', getAllVenues);

export default router;

