const { EventModel } = require('../models/Event.js');

const seedEvents = async () => {
  try {
    await EventModel.bulkCreate([
      {
        title: 'Welcome Bash',
        description: 'Annual university welcome event',
        date: '2025-08-20T10:00:00Z',
        location: 'Main Campus',
        status: 'active',
      },
      {
        title: 'Career Fair',
        description: 'Job opportunities for students',
        date: '2025-09-15T09:00:00Z',
        location: 'Convention Center',
        status: 'active',
      },
    ]);
    console.log('Events seeded successfully');
  } catch (error) {
    console.error('Error seeding events:', error);
  }
};

seedEvents();