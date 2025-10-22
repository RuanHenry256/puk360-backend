import { Router } from 'express';
import { cancelRSVP, getAttendees, JoinEvent, getUserRsvps } from '../controllers/rsvpController.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RSVPRequest:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user joining the event
 *       example:
 *         userId: "12345"
 *     RSVPResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         error:
 *           type: string
 *     Attendee:
 *       type: object
 *       properties:
 *         User_ID:
 *           type: string
 *           description: User ID of the attendee
 */

/**
 * @swagger
 * /api/events/{id}/join:
 *   post:
 *     summary: RSVP for an event
 *     description: Register a user to attend an event
 *     tags: [RSVP]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RSVPRequest'
 *     responses:
 *       201:
 *         description: Successfully registered for event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RSVPResponse'
 *       400:
 *         description: Already joined this event or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RSVPResponse'
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/join', JoinEvent);

/**
 * @swagger
 * /api/events/{id}/join:
 *   delete:
 *     summary: Cancel RSVP for an event
 *     description: Remove user's registration from an event
 *     tags: [RSVP]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RSVPRequest'
 *     responses:
 *       200:
 *         description: Successfully canceled RSVP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RSVPResponse'
 *       404:
 *         description: You are not registered for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RSVPResponse'
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/join', cancelRSVP);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: Get attendees for a specific event
 *     description: Returns a list of attendees (with names, emails, and RSVP status) for the specified event.
 *     tags: [RSVP]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the event
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendees retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               event:
 *                 Event_ID: 1
 *                 Title: "Welcome Bash"
 *                 Date: "2025-08-20T10:00:00.000Z"
 *                 Venue: "Main Campus"
 *                 Status: "active"
 *               attendees:
 *                 - id: 2
 *                   name: "Jane Doe"
 *                   email: "jane@nwu.ac.za"
 *                   RSVP_Status: "Attending"
 *                 - id: 3
 *                   name: "John Smith"
 *                   email: "john@nwu.ac.za"
 *                   RSVP_Status: "Attending"
 *               attendeeCount: 2
 *               message: "Attendees retrieved successfully"
 *       404:
 *         description: Event or attendees not found
 *       500:
 *         description: Server error
 */
router.get('/:id/attendees', getAttendees);
router.get('/users/:userId', getUserRsvps);

export default router;
