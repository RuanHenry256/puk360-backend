import { Sequelize } from "sequelize";
import Event_Attendees from "../models/EventAttendees.js";
//import Event from "..models/Event.js";
import User from "../models/User.js";

// POST: Join 
export const JoinEvent = async(req, res) => {
    const eventId = req.params.id;
    const { userId } = req.body;

    try{
        
        //check event is approved 
        const event = await Event.findByPk(eventId);
        
        if (!event){
            return res.status(404).json({ error :"Event not found" });
        }
        
        if (event.Status !== "Scheduled") {
            return res.status(400).json({ error: "Event not scheduled yet" });
        }

        //Create  RSVP
        const rsvp = await Event_Attendees.create({
            Event_ID: eventId,
            User_ID: userId,
            RSVP_Status: 'Attending',
            Timestamp: new Date()

        });
         
        res.status(201).json({ message: "Successfully registered for event" });

    } catch (err){
        if (err.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ error: "Already joined this event" });
        } else {
            res.status(500).json({ error: err.message })
        }
    }
};

//Cancel RSVP API
export const cancelRSVP = async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user?.id || req.body.userId;

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
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email', 'role'],
                }
            ]
        })

        if (attendees.length === 0) {
            return res.status(404).json({ message: "No attendees found for this event"});
        }

        res.status(200).json(attendees);
    }catch (err) {
        res.status(500).json({ error: err.message});
    }
}
        
   
    





    

