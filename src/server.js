import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import rsvpRoutes from './routes/rsvpRoutes.js';


import sequelize from "./config/db.js";
import User from "./models/User.js"; // Example model

// Test DB connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Azure Database");
    await sequelize.sync(); // just sync models without altering columns
    console.log("✅ Database synced");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
})();


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', reviewRoutes);  // nested under events
app.use('/api/admin', adminRoutes);
app.use('/api/events', rsvpRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('PUK360 API is running 🚀');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
