import Venue from '../models/venue.js';

export const getAllVenues = async (_req, res) => {
  try {
    const venues = await Venue.findAll({
      attributes: ['Venue_ID', 'Name', 'Capacity', 'Location'],
      order: [['Name', 'ASC']],
    });
    res.status(200).json({ status: 'success', data: venues });
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Failed to fetch venues', details: error.message });
  }
};

