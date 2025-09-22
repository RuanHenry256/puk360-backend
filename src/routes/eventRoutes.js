import { Router } from 'express';
import {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';

const router = Router();
router.get('/', getAllEvents);
router.get('/:id', getEvent);
router.post('/', createEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
