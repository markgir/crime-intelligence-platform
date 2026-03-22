const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// GET /api/people - List people (paginated, search)
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;
  try {
    const searchParam = `%${search}%`;
    const result = await pool.query(
      `SELECT id, first_name, last_name, date_of_birth, id_number, nationality, notes, created_at, updated_at
       FROM people
       WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR id_number ILIKE $1 OR nationality ILIKE $1
       ORDER BY last_name, first_name
       LIMIT $2 OFFSET $3`,
      [searchParam, limit, offset]
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM people WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR id_number ILIKE $1 OR nationality ILIKE $1`,
      [searchParam]
    );
    res.json({ people: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching people.' });
  }
});

// POST /api/people - Create person
router.post('/', async (req, res) => {
  const { first_name, last_name, date_of_birth, id_number, nationality, notes } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'first_name and last_name are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO people (first_name, last_name, date_of_birth, id_number, nationality, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, date_of_birth || null, id_number || null, nationality || null, notes || null]
    );
    res.status(201).json({ person: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A person with this ID number already exists.' });
    }
    res.status(500).json({ error: 'Error creating person.' });
  }
});

// GET /api/people/:id - Get person details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const personResult = await pool.query('SELECT * FROM people WHERE id = $1', [id]);
    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found.' });
    }
    const addressesResult = await pool.query('SELECT * FROM people_addresses WHERE person_id = $1', [id]);
    const phonesResult = await pool.query('SELECT * FROM people_phones WHERE person_id = $1', [id]);
    const socialResult = await pool.query('SELECT * FROM social_media_profiles WHERE person_id = $1', [id]);
    const person = personResult.rows[0];
    person.addresses = addressesResult.rows;
    person.phones = phonesResult.rows;
    person.social_media = socialResult.rows;
    res.json({ person });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching person.' });
  }
});

// PUT /api/people/:id - Update person
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, date_of_birth, id_number, nationality, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE people SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
       date_of_birth = COALESCE($3, date_of_birth), id_number = COALESCE($4, id_number),
       nationality = COALESCE($5, nationality), notes = COALESCE($6, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [first_name, last_name, date_of_birth, id_number, nationality, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found.' });
    }
    res.json({ person: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating person.' });
  }
});

// DELETE /api/people/:id - Delete person
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM people WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found.' });
    }
    res.json({ message: 'Person deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting person.' });
  }
});

// POST /api/people/:id/addresses - Add address
router.post('/:id/addresses', async (req, res) => {
  const { id } = req.params;
  const { address_type, street, city, postal_code, country } = req.body;
  if (!address_type) {
    return res.status(400).json({ error: 'address_type is required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO people_addresses (person_id, address_type, street, city, postal_code, country)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, address_type, street || null, city || null, postal_code || null, country || null]
    );
    res.status(201).json({ address: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error adding address.' });
  }
});

// POST /api/people/:id/phones - Add phone
router.post('/:id/phones', async (req, res) => {
  const { id } = req.params;
  const { phone_type, phone_number } = req.body;
  if (!phone_type || !phone_number) {
    return res.status(400).json({ error: 'phone_type and phone_number are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO people_phones (person_id, phone_type, phone_number) VALUES ($1, $2, $3) RETURNING *`,
      [id, phone_type, phone_number]
    );
    res.status(201).json({ phone: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error adding phone.' });
  }
});

// POST /api/people/:id/social-media - Add social media profile
router.post('/:id/social-media', async (req, res) => {
  const { id } = req.params;
  const { platform, username, url } = req.body;
  if (!platform) {
    return res.status(400).json({ error: 'platform is required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO social_media_profiles (person_id, platform, username, url) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, platform, username || null, url || null]
    );
    res.status(201).json({ profile: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error adding social media profile.' });
  }
});

module.exports = router;
