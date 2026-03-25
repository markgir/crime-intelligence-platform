#!/usr/bin/env node
/**
 * Seed default admin user into the database.
 *
 * Usage:
 *   node seed-admin.js <username> <email> <password>
 *
 * Run from the backend directory so that bcryptjs and pg are resolved from
 * backend/node_modules, and backend/.env is loaded automatically.
 */

'use strict';

const path = require('path');

// Ensure .env is loaded from the backend directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const username = process.argv[2] || 'admin';
const email = process.argv[3] || 'admin@crime-intelligence.local';
// Accept password via environment variable (preferred – not visible in ps aux)
// or fall back to argv[4] for direct invocation.
const password = process.env.SEED_ADMIN_PASSWORD || process.argv[4];

if (!password) {
  console.error('ERROR: password is required (set SEED_ADMIN_PASSWORD env var or pass as argv[4])');
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crime_intelligence',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
});

(async () => {
  let client;
  try {
    client = await pool.connect();
    const hash = await bcrypt.hash(password, 10);
    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (username) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role           = 'admin'
       RETURNING id, username, email, role`,
      [username, email, hash]
    );
    console.log('OK:' + result.rows[0].username);
  } catch (err) {
    console.error('ERROR:' + err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
})();
