const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// GET /api/vehicles/plate/:plate - Search by registration plate (before /:id)
router.get('/plate/:plate', async (req, res) => {
  const { plate } = req.params;
  try {
    const result = await pool.query(
      `SELECT v.*, p.first_name, p.last_name
       FROM vehicles v
       LEFT JOIN people p ON v.owner_id = p.id
       WHERE v.registration_plate ILIKE $1`,
      [`%${plate}%`]
    );
    res.json({ vehicles: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error searching vehicles by plate.' });
  }
});

// GET /api/vehicles - List vehicles
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;
  try {
    const searchParam = `%${search}%`;
    const result = await pool.query(
      `SELECT v.*, p.first_name, p.last_name
       FROM vehicles v
       LEFT JOIN people p ON v.owner_id = p.id
       WHERE v.registration_plate ILIKE $1 OR v.brand ILIKE $1 OR v.model ILIKE $1
       ORDER BY v.created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchParam, limit, offset]
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM vehicles WHERE registration_plate ILIKE $1 OR brand ILIKE $1 OR model ILIKE $1`,
      [searchParam]
    );
    res.json({ vehicles: result.rows, total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching vehicles.' });
  }
});

// GET /api/vehicles/:id - Get vehicle details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT v.*, p.first_name, p.last_name
       FROM vehicles v
       LEFT JOIN people p ON v.owner_id = p.id
       WHERE v.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching vehicle.' });
  }
});

// POST /api/vehicles - Create vehicle
router.post('/', async (req, res) => {
  const { registration_plate, brand, model, color, vehicle_type, owner_id, notes } = req.body;
  if (!registration_plate || !brand || !model) {
    return res.status(400).json({ error: 'registration_plate, brand and model are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO vehicles (registration_plate, brand, model, color, vehicle_type, owner_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [registration_plate, brand, model, color || null, vehicle_type || null, owner_id || null, notes || null]
    );
    res.status(201).json({ vehicle: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A vehicle with this registration plate already exists.' });
    }
    res.status(500).json({ error: 'Error creating vehicle.' });
  }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { registration_plate, brand, model, color, vehicle_type, owner_id, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicles SET
         registration_plate = COALESCE($1, registration_plate),
         brand = COALESCE($2, brand),
         model = COALESCE($3, model),
         color = COALESCE($4, color),
         vehicle_type = COALESCE($5, vehicle_type),
         owner_id = COALESCE($6, owner_id),
         notes = COALESCE($7, notes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [registration_plate, brand, model, color, vehicle_type, owner_id, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating vehicle.' });
  }
});

// PUT /api/vehicles/:id/owner - Update vehicle owner
router.put('/:id/owner', async (req, res) => {
  const { id } = req.params;
  const { owner_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicles SET owner_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [owner_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating vehicle owner.' });
  }
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found.' });
    }
    res.json({ message: 'Vehicle deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting vehicle.' });
  }
});

module.exports = router;
