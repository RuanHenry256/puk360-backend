import { Router } from 'express';
//Import the real handler name of the controller export
import { cancelRSVP, getAttendees, JoinEvent } from '../controllers/rsvpController.js';

const router = Router();

router.post('/:id/join', JoinEvent);//RSVP for event
router.delete('/:id/join', cancelRSVP);// Cancel RSVP
router.get('/:id/attendees', getAttendees)// List event attendees

export default router;