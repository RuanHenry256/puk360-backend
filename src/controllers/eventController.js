import Event from '../models/event.js';
import Venue from '../models/venue.js';
import { Op } from 'sequelize';

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const where = {};
    if (req.query.hostUserId) {
      where.Host_User_ID = Number(req.query.hostUserId);
    }
    const events = await Event.findAll({
      attributes: [
        'Event_ID', 
        'Title', 
        'Description', 
        'Date', 
        'Time',
        'endTime',
        'Status',
        'type',
        'category',
        'hostedBy',
        'venue',
        'campus',
        'Venue_ID',
        'ImageUrl'
      ],
      where,
    });
    
    res.status(200).json({
      status: 'success',
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch events',
      details: error.message,
    });
  }
};

// Get event by ID
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      attributes: [
        'Event_ID', 
        'Title', 
        'Description', 
        'Date', 
        'Time',
        'endTime',
        'Status',
        'type',
        'category',
        'hostedBy',
        'venue',
        'campus',
        'Venue_ID',
        'Host_User_ID',
        'ImageUrl'
      ],
    });
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        error: 'Event not found',
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch event',
      details: error.message,
    });
  }
};

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { 
      Title, 
      Description, 
      Date, 
      Time,
      Host_User_ID, 
      Venue_ID, 
      Status,
      type,
      category,
      hostedBy,
      endTime,
      venue,
      campus,
      ImageUrl
    } = req.body;
    let resolvedVenueId = (Venue_ID !== undefined && Venue_ID !== null && Venue_ID !== '') ? Number(Venue_ID) : undefined;
    if (!resolvedVenueId && process.env.DEFAULT_VENUE_ID) {
      resolvedVenueId = Number(process.env.DEFAULT_VENUE_ID);
    }
    if (!resolvedVenueId) {
      const [v] = await Venue.findOrCreate({
        where: { Name: 'Unspecified' },
        defaults: { Capacity: null, Location: null },
      });
      resolvedVenueId = v.Venue_ID;
    }

    const cleanImageUrl = (typeof ImageUrl === 'string' && ImageUrl.trim().length) ? ImageUrl.trim() : null;
    const event = await Event.create({
      Title,
      Description,
      Date,
      Time,
      Host_User_ID,
      Venue_ID: resolvedVenueId,
      Status: Status || 'Scheduled',
      type: type || 'General Event',
      category: category || 'Entertainment',
      hostedBy: hostedBy || 'NWU Events',
      endTime,
      venue,
      campus: campus || 'Potchefstroom',
      ImageUrl: cleanImageUrl
    });
    
    res.status(201).json({
      status: 'success',
      message: 'Event created',
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      error: 'Failed to create event',
      details: error.message,
    });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        status: 'error',
        error: 'Event not found',
      });
    }
    
    const { 
      Title, 
      Description, 
      Date, 
      Time,
      Host_User_ID, 
      Venue_ID, 
      Status,
      type,
      category,
      hostedBy,
      endTime,
      venue,
      campus,
      ImageUrl
    } = req.body;
    
    await event.update({ 
      Title, 
      Description, 
      Date, 
      Time,
      Host_User_ID, 
      Venue_ID, 
      Status,
      type,
      category,
      hostedBy,
      endTime,
      venue,
      campus,
      ImageUrl
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Event updated',
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      error: 'Failed to update event',
      details: error.message,
    });
  }
};

// Update event status
export const updateEventStatus = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        status: 'error',
        error: 'Event not found',
      });
    }
    const { Status } = req.body;
    await event.update({ Status });
    res.status(200).json({
      status: 'success',
      message: 'Event status updated',
      data: event,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      error: 'Failed to update event status',
      details: error.message,
    });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        status: 'error',
        error: 'Event not found',
      });
    }
    await event.destroy();
    res.status(204).json({
      status: 'success',
      message: 'Event deleted',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: 'Failed to delete event',
      details: error.message,
    });
  }
};
