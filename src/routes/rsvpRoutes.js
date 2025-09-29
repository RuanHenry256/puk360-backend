import { Router } from 'express';
import { cancelRSVP, getAttendees, JoinEvent } from '../controllers/rsvpController.js';

const router = Router();

router.post('/:id/join', JoinEvent);//RSVP for event
router.delete('/:id/join', cancelRSVP);// Cancel RSVP
router.get('/:id/attendees', getAttendees)// List event attendees

export default router;

