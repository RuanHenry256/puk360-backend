import Event from '../models/Event.js';

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      attributes: ['id', 'title', 'description', 'date', 'location', 'status', 'createdAt'],
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
      attributes: ['id', 'title', 'description', 'date', 'location', 'status', 'createdAt'],
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
    const { title, description, date, location, status } = req.body;
    const event = await Event.create({
      title,
      description,
      date,
      location,
      status: status || 'active',
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
    const { title, description, date, location, status } = req.body;
    await event.update({ title, description, date, location, status });
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
    const { status } = req.body;
    await event.update({ status });
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