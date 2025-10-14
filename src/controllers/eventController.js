import Event from '../models/Event.js';
import Venue from '../models/Venue.js';
import { Op } from 'sequelize';

// Helper function to format time for display
const formatTimeForDisplay = (timeValue) => {
  if (!timeValue) return '';
  
  // If it's a Date object, extract UTC time
  if (timeValue instanceof Date) {
    const hours = timeValue.getUTCHours().toString().padStart(2, '0');
    const minutes = timeValue.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // For strings or other types, use safe conversion
  return String(timeValue).substring(0, 5);
};
// Helper function to create time range display
const createTimeRange = (startTime, endTime) => {
  const formattedStart = formatTimeForDisplay(startTime);
  
  if (!endTime) {
    return formattedStart; // Return just start time if no end time
  }
  
  const formattedEnd = formatTimeForDisplay(endTime);
  return `${formattedStart} - ${formattedEnd}`;
};

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
    
    // Format events with time range
    const formattedEvents = events.map(event => ({
      ...event.toJSON(),
      displayTime: createTimeRange(event.Time, event.endTime),
      // Keep individual times for editing purposes
      Time: formatTimeForDisplay(event.Time),
      endTime: event.endTime ? formatTimeForDisplay(event.endTime) : null
    }));
    
    res.status(200).json({
      status: 'success',
      data: formattedEvents,
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
    
    // Format event with time range
    const formattedEvent = {
      ...event.toJSON(),
      displayTime: createTimeRange(event.Time, event.endTime),
      // Keep individual times for editing purposes
      Time: formatTimeForDisplay(event.Time),
      endTime: event.endTime ? formatTimeForDisplay(event.endTime) : null
    };
    
    res.status(200).json({
      status: 'success',
      data: formattedEvent,
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
    
    // Return created event with formatted time range
    const formattedEvent = {
      ...event.toJSON(),
      displayTime: createTimeRange(event.Time, event.endTime)
    };
    
    res.status(201).json({
      status: 'success',
      message: 'Event created',
      data: formattedEvent,
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
    
    // Return updated event with formatted time range
    const formattedEvent = {
      ...event.toJSON(),
      displayTime: createTimeRange(event.Time, event.endTime)
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Event updated',
      data: formattedEvent,
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
    
    // Return updated event with formatted time range
    const formattedEvent = {
      ...event.toJSON(),
      displayTime: createTimeRange(event.Time, event.endTime)
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Event status updated',
      data: formattedEvent,
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