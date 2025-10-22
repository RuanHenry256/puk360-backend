import { Sequelize } from "sequelize";
import Event_Attendees from "../models/eventattendees.js";
import Event from "../models/event.js";
import User from "../models/user.js";
import sequelize from "../config/db.js";

// POST: Join 
export const JoinEvent = async(req, res) => {
    const event_Id = Number(req.params.id);
    const userIdNum = Number(req.body?.userId);

    try {
        if (!event_Id || !userIdNum) {
            return res.status(400).json({ error: 'Invalid event or user' });
        }

        // Disallow RSVP for events that already happened
        const ev = await Event.findByPk(event_Id, { attributes: ['Event_ID','Date','endTime','startTime'] });
        if (!ev) return res.status(404).json({ error: 'Event not found' });
        try {
            const datePart = typeof ev.Date === 'string' ? ev.Date : new Date(ev.Date).toISOString().slice(0,10);
            const timePart = (ev.endTime || ev.startTime || '23:59').toString().slice(0,5);
            const endDt = new Date(`${datePart}T${timePart}:00`);
            if (new Date() >= endDt) {
                return res.status(400).json({ error: 'Cannot RSVP for an event that has already finished' });
            }
        } catch { /* ignore parse errors */ }
        // Check if already joined using Sequelize
        const existingAttendee = await Event_Attendees.findOne({
            where: { 
                Event_ID: event_Id, 
                User_ID: userIdNum 
            }
        });

        if (existingAttendee) {
            return res.status(400).json({ error: "Already joined this event" });
        }

        // Create using Sequelize model
        const newAttendee = await Event_Attendees.create({
            Event_ID: event_Id,
            User_ID: userIdNum,
            RSVP_Status: 'Attending'
        });

        // Verify creation
        if (!newAttendee) {
            return res.status(500).json({ error: "Failed to create attendance record" });
        }

        res.status(201).json({ 
            message: "Successfully registered for event",
            data: {
                Event_ID: newAttendee.Event_ID,
                User_ID: newAttendee.User_ID,
                RSVP_Status: newAttendee.RSVP_Status,
                Timestamp: newAttendee.Timestamp
            }
        });

    } catch (err) {
        console.error('JoinEvent Error:', err?.original || err);
        
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ error: "Invalid event or user ID" });
        }
        
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: "Already registered for this event" });
        }
        
        return res.status(500).json({ error: "Internal server error: " + err.message });
    }
};

//Cancel RSVP API
export const cancelRSVP = async (req, res) => {
    const eventId = req.params.id;
    const userIdNum = Number(req.body?.userId);

    try{
        const deleted = await Event_Attendees.destroy({
            where: { Event_ID: eventId, User_ID: userIdNum },
        });

        if (!deleted) {
            return res.status(404).json({ error: "You are not registered for this event" });
        }

        res.status(200).json({ message: "RSVP cancelled successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//Get all attendees API
// Get all attendees API (Fixed)
export const getAttendees = async (req, res) => {
  const eventId = req.params.id;

  try {
    // Check if the event exists
    const event = await Event.findOne({
      where: { Event_ID: eventId }, // Fixed field name
      attributes: ['Event_ID', 'Title', 'Date', 'venue', 'Status'] // Fixed field names
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Fetch attendees with user details
    const [rows] = await sequelize.query(
      `SELECT EA.User_ID AS id, U.Name AS name, U.Email AS email, EA.RSVP_Status AS status
       FROM [Event_Attendees] EA
       LEFT JOIN [User] U ON U.User_ID = EA.User_ID
       WHERE EA.Event_ID = :eventId
       ORDER BY U.Name ASC`,
      { replacements: { eventId } }
    );

    // Return event info and attendees
    res.status(200).json({
      event: {
        id: event.Event_ID, // Fixed field name
        title: event.Title, // Fixed field name
        date: event.Date, // Fixed field name
        venue: event.venue,
        status: event.Status, // Fixed field name
      },
      attendees: rows, 
      attendeeCount: rows.length, 
      message: rows.length > 0
          ? "Attendees retrieved successfully"
          : "No attendees yet for this event",
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Unknown error occurred" });
  }
}

// List a user's RSVPs with event info; mark past events as Attended
export const getUserRsvps = async (req, res) => {
  const userId = Number(req.params.userId || req.query.userId);
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  try {
    // Mark past events as Attended for this user
    try {
      const [updated] = await sequelize.query(
        `UPDATE EA
         SET RSVP_Status = 'Attended'
         FROM Event_Attendees EA
         INNER JOIN Event E ON E.Event_ID = EA.Event_ID
         WHERE EA.User_ID = :userId AND CAST(E.[Date] AS date) < CAST(GETDATE() AS date)
           AND (EA.RSVP_Status IS NULL OR EA.RSVP_Status <> 'Attended')`,
        { replacements: { userId } }
      );
    } catch {}

    const [rows] = await sequelize.query(
      `SELECT EA.Event_ID     AS eventId,
              E.Title         AS title,
              E.[Date]        AS [date],
              E.venue         AS venue,
              E.campus        AS campus,
              E.category      AS category,
              EA.RSVP_Status  AS rsvpStatus,
              EA.Timestamp    AS joinedAt
       FROM Event_Attendees EA
       INNER JOIN Event E ON E.Event_ID = EA.Event_ID
       WHERE EA.User_ID = :userId
       ORDER BY E.[Date] DESC, EA.Timestamp DESC`,
      { replacements: { userId } }
    );
    const today = new Date(); today.setHours(0,0,0,0);
    const data = rows.map(r => {
      const d = new Date(new Date(r.date).toISOString().slice(0,10)+'T00:00:00');
      const status = d >= today ? 'Upcoming' : 'Completed';
      return { ...r, status };
    });
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch RSVPs' });
  }
};


        
   
    





    



