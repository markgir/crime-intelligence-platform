const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/crimes/types/all - List crime types (before /:id)
router.get('/types/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM crime_types ORDER BY name');
    res.json({ types: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching crime types.' });
  }
});

// POST /api/crimes/types - Create crime type
router.post('/types', async (req, res) => {
  const { name, description, custom_fields } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO crime_types (name, description, custom_fields) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, custom_fields ? JSON.stringify(custom_fields) : null]
    );
    res.status(201).json({ type: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Crime type already exists.' });
    }
    res.status(500).json({ error: 'Error creating crime type.' });
  }
});

// DELETE /api/crimes/types/:id - Delete crime type
router.delete('/types/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM crime_types WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crime type not found.' });
    }
    res.json({ message: 'Crime type deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting crime type.' });
  }
});

// GET /api/crimes - List crimes
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search = '', status, crime_type_id } = req.query;
  const offset = (page - 1) * limit;
  try {
    let conditions = ['(c.location ILIKE $1 OR c.description ILIKE $1)'];
    let params = [`%${search}%`];
    let idx = 2;
    if (status) { conditions.push(`c.status = $${idx}`); params.push(status); idx++; }
    if (crime_type_id) { conditions.push(`c.crime_type_id = $${idx}`); params.push(crime_type_id); idx++; }
    const where = conditions.join(' AND ');
    const result = await pool.query(
      `SELECT c.*, ct.name AS crime_type_name
       FROM crimes c
       LEFT JOIN crime_types ct ON c.crime_type_id = ct.id
       WHERE ${where}
       ORDER BY c.crime_date DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    const countResult = await pool.query(`SELECT COUNT(*) FROM crimes c WHERE ${where}`, params);
    res.json({ crimes: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching crimes.' });
  }
});

// GET /api/crimes/:id - Get crime details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const crimeResult = await pool.query(
      `SELECT c.*, ct.name AS crime_type_name FROM crimes c LEFT JOIN crime_types ct ON c.crime_type_id = ct.id WHERE c.id = $1`,
      [id]
    );
    if (crimeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Crime not found.' });
    }
    const victimsResult = await pool.query(
      `SELECT cv.*, p.first_name, p.last_name FROM crime_victims cv JOIN people p ON cv.person_id = p.id WHERE cv.crime_id = $1`,
      [id]
    );
    const suspectsResult = await pool.query(
      `SELECT cs.*, p.first_name, p.last_name FROM crime_suspects cs JOIN people p ON cs.person_id = p.id WHERE cs.crime_id = $1`,
      [id]
    );
    const crime = crimeResult.rows[0];
    crime.victims = victimsResult.rows;
    crime.suspects = suspectsResult.rows;
    res.json({ crime });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching crime.' });
  }
});

// POST /api/crimes - Create crime
router.post('/', async (req, res) => {
  const { crime_type_id, location, latitude, longitude, crime_date, description, status, custom_data } = req.body;
  if (!location || !crime_date || !description) {
    return res.status(400).json({ error: 'location, crime_date and description are required.' });
  }
  const crimeStatus = ['open', 'investigating', 'closed'].includes(status) ? status : 'open';
  try {
    const result = await pool.query(
      `INSERT INTO crimes (crime_type_id, location, latitude, longitude, crime_date, description, status, custom_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [crime_type_id || null, location, latitude || null, longitude || null, crime_date, description, crimeStatus, custom_data ? JSON.stringify(custom_data) : null]
    );
    res.status(201).json({ crime: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating crime.' });
  }
});

// PUT /api/crimes/:id - Update crime
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { crime_type_id, location, latitude, longitude, crime_date, description, status, custom_data } = req.body;
  try {
    const result = await pool.query(
      `UPDATE crimes SET
         crime_type_id = COALESCE($1, crime_type_id),
         location = COALESCE($2, location),
         latitude = COALESCE($3, latitude),
         longitude = COALESCE($4, longitude),
         crime_date = COALESCE($5, crime_date),
         description = COALESCE($6, description),
         status = COALESCE($7, status),
         custom_data = COALESCE($8, custom_data),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [crime_type_id, location, latitude, longitude, crime_date, description, status, custom_data ? JSON.stringify(custom_data) : null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crime not found.' });
    }
    res.json({ crime: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating crime.' });
  }
});

// DELETE /api/crimes/:id - Delete crime
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM crimes WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crime not found.' });
    }
    res.json({ message: 'Crime deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting crime.' });
  }
});

// POST /api/crimes/:id/victims - Add victim
router.post('/:id/victims', async (req, res) => {
  const { id } = req.params;
  const { person_id, relationship, notes } = req.body;
  if (!person_id) {
    return res.status(400).json({ error: 'person_id is required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO crime_victims (crime_id, person_id, relationship, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, person_id, relationship || null, notes || null]
    );
    res.status(201).json({ victim: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error adding victim.' });
  }
});

// DELETE /api/crimes/:crimeId/victims/:victimId - Remove victim
router.delete('/:crimeId/victims/:victimId', async (req, res) => {
  const { crimeId, victimId } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM crime_victims WHERE crime_id = $1 AND id = $2 RETURNING id',
      [crimeId, victimId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Victim record not found.' });
    }
    res.json({ message: 'Victim removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error removing victim.' });
  }
});

// POST /api/crimes/:id/suspects - Add suspect
router.post('/:id/suspects', async (req, res) => {
  const { id } = req.params;
  const { person_id, confidence_level, notes } = req.body;
  if (!person_id) {
    return res.status(400).json({ error: 'person_id is required.' });
  }
  const level = ['low', 'medium', 'high'].includes(confidence_level) ? confidence_level : null;
  try {
    const result = await pool.query(
      'INSERT INTO crime_suspects (crime_id, person_id, confidence_level, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, person_id, level, notes || null]
    );
    res.status(201).json({ suspect: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error adding suspect.' });
  }
});

// DELETE /api/crimes/:crimeId/suspects/:suspectId - Remove suspect
router.delete('/:crimeId/suspects/:suspectId', async (req, res) => {
  const { crimeId, suspectId } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM crime_suspects WHERE crime_id = $1 AND id = $2 RETURNING id',
      [crimeId, suspectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Suspect record not found.' });
    }
    res.json({ message: 'Suspect removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error removing suspect.' });
  }
});

module.exports = router;
