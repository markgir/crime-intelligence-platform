const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crime_intelligence',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT) || 5432,
});

pool.on('connect', () => {
  console.log('Database connection established successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;