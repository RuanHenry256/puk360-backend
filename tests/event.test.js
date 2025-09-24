import request from 'supertest';
import app from '../server.js';
import sequelize from '../config/db.js';
import Event from '../models/Event.js';
import jwt from 'jsonwebtoken';

describe('Event API', () => {
  let token;

  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Reset database
    // Seed test data
    await Event.create({
      title: 'Test Event',
      description: 'Test Description',
      date: '2025-08-20T10:00:00Z',
      location: 'Test Location',
      status: 'active',
    });
    // Generate test JWT token
    token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should fetch all events', async () => {
    const res = await request(app).get('/api/events');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0]).toHaveProperty('title', 'Test Event');
  });

  it('should fetch an event by ID', async () => {
    const event = await Event.findOne({ where: { title: 'Test Event' } });
    const res = await request(app).get(`/api/events/${event.id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data).toHaveProperty('title', 'Test Event');
  });

  it('should create a new event with valid token', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Event',
        description: 'New Description',
        date: '2025-08-21T10:00:00Z',
        location: 'New Location',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual('success');
    expect(res.body.data).toHaveProperty('title', 'New Event');
  });

  it('should return 401 for creating event without token', async () => {
    const res = await request(app).post('/api/events').send({
      title: 'Unauthorized Event',
      date: '2025-08-21T10:00:00Z',
      location: 'Unauthorized Location',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toEqual('error');
  });

  it('should update event status', async () => {
    const event = await Event.findOne({ where: { title: 'Test Event' } });
    const res = await request(app)
      .patch(`/api/events/${event.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('success');
    expect(res.body.data.status).toEqual('cancelled');
  });

  it('should delete an event', async () => {
    const event = await Event.create({
      title: 'Event to Delete',
      description: 'To be deleted',
      date: '2025-08-22T10:00:00Z',
      location: 'Delete Location',
      status: 'active',
    });
    const res = await request(app)
      .delete(`/api/events/${event.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(204);
    expect(res.body.status).toEqual('success');
  });
});