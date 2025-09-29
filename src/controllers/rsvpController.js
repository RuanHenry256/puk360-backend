import { Sequelize } from "sequelize";
import Event_Attendees from "../models/EventAttendees.js";
import User from "../models/User.js";
import sequelize from "../config/db.js";

// POST: Join 
export const JoinEvent = async(req, res) => {
    const event_Id = req.params.id;
    const { userId } = req.body;

    try {
        // Check if user already joined using COUNT
        const [result] = await sequelize.query(
            `SELECT COUNT(*) as count FROM Event_Attendees WHERE Event_ID = :event_Id AND User_ID = :userId`,
            {
                replacements: { event_Id, userId },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (result.count > 0) {
            return res.status(400).json({ error: "Already joined this event" });
        }

        // Insert using raw SQL
        await sequelize.query(
            `INSERT INTO Event_Attendees (Event_ID, User_ID, RSVP_Status, Timestamp) 
             VALUES (:event_Id, :userId, 'Attending', GETDATE())`,
            {
                replacements: { event_Id, userId },
            }
        );
         
        res.status(201).json({ message: "Successfully registered for event" });

    } catch (err) {
        console.error('JoinEvent Error:', err);
        
        if (err.original && err.original.number === 547) {
            return res.status(400).json({ error: "Invalid event or user ID" });
        }
        
        return res.status(500).json({ error: "Internal server error" });
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
export const getAttendees = async (req, res) => {
    const eventId = req.params.id;

    try{
        const attendees = await Event_Attendees.findAll({
            where: { Event_ID: eventId},
                    attributes: ['User_ID'],

        })

        if (attendees.length === 0) {
            return res.status(404).json({ message: "No attendees found for this event"});
        }

        res.status(200).json(attendees);
    }catch (err) {
        res.status(500).json({ error: err.message});
    }
}
        
   
    





    

