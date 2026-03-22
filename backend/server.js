const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiting: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const peopleRoutes = require('./routes/people');
const vehiclesRoutes = require('./routes/vehicles');
const crimesRoutes = require('./routes/crimes');
const relationshipsRoutes = require('./routes/relationships');
const backupsRoutes = require('./routes/backups');

app.use('/api/auth', authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/crimes', crimesRoutes);
app.use('/api/relationships', relationshipsRoutes);
app.use('/api/backups', backupsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
