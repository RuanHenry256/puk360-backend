import { Sequelize } from "sequelize";
import Event_Attendees from "../models/eventattendees.js";
import Event from "../models/event.js";
import User from "../models/user.js";
import sequelize from "../config/db.js";

// POST: Join 
export const JoinEvent = async(req, res) => {
    const event_Id = req.params.id;
    const { userId } = req.body;

    try {
        // Check if already joined using Sequelize
        const existingAttendee = await Event_Attendees.findOne({
            where: { 
                Event_ID: event_Id, 
                User_ID: userId 
            }
        });

        if (existingAttendee) {
            return res.status(400).json({ error: "Already joined this event" });
        }

        // Create using Sequelize model
        const newAttendee = await Event_Attendees.create({
            Event_ID: event_Id,
            User_ID: userId,
            RSVP_Status: 'Attending',
            Timestamp: new Date()
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
        console.error('JoinEvent Error:', err);
        
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
    const { userId } = req.body;

    try{
        const deleted = await Event_Attendees.destroy({
            where: { Event_ID: eventId, User_ID: userId },
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

    // Fetch attendees for that event
    const attendees = await Event_Attendees.findAll({
      where: { Event_ID: eventId },
      attributes: ["User_ID"],
    });

    // Map to clean array
    const userIds = attendees.map((a) => a.User_ID);

    // Return event info and attendees
    res.status(200).json({
      event: {
        id: event.Event_ID, // Fixed field name
        title: event.Title, // Fixed field name
        date: event.Date, // Fixed field name
        venue: event.venue,
        status: event.Status, // Fixed field name
      },
      attendees: userIds, 
      attendeeCount: userIds.length, 
      message: userIds.length > 0
          ? "Attendees retrieved successfully"
          : "No attendees yet for this event",
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Unknown error occurred" });
  }
}


        
   
    





    

