const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/cameras - List cameras
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;
  const conditions = status ? ['status = $1'] : [];
  const params = status ? [status] : [];
  let idx = params.length + 1;
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const result = await pool.query(
      `SELECT * FROM cctv_cameras ${where} ORDER BY name LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    const countResult = await pool.query(`SELECT COUNT(*) FROM cctv_cameras ${where}`, params);
    res.json({ cameras: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching cameras.' });
  }
});

// GET /api/cameras/:id - Get camera details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cctv_cameras WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Camera not found.' });
    res.json({ camera: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching camera.' });
  }
});

// POST /api/cameras - Create camera
router.post('/', requireRole('admin', 'investigator'), async (req, res) => {
  const { name, location, latitude, longitude, stream_url, status, camera_type, notes, installed_at } = req.body;
  if (!name || !location) {
    return res.status(400).json({ error: 'name and location are required.' });
  }
  const camStatus = ['active', 'inactive', 'maintenance'].includes(status) ? status : 'active';
  try {
    const result = await pool.query(
      `INSERT INTO cctv_cameras (name, location, latitude, longitude, stream_url, status, camera_type, notes, installed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, location, latitude || null, longitude || null, stream_url || null, camStatus, camera_type || null, notes || null, installed_at || null]
    );
    res.status(201).json({ camera: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating camera.' });
  }
});

// PUT /api/cameras/:id - Update camera
router.put('/:id', requireRole('admin', 'investigator'), async (req, res) => {
  const { id } = req.params;
  const { name, location, latitude, longitude, stream_url, status, camera_type, notes, installed_at } = req.body;
  if (status && !['active', 'inactive', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: 'status must be active, inactive or maintenance.' });
  }
  try {
    const result = await pool.query(
      `UPDATE cctv_cameras SET
         name = COALESCE($1, name),
         location = COALESCE($2, location),
         latitude = COALESCE($3, latitude),
         longitude = COALESCE($4, longitude),
         stream_url = COALESCE($5, stream_url),
         status = COALESCE($6, status),
         camera_type = COALESCE($7, camera_type),
         notes = COALESCE($8, notes),
         installed_at = COALESCE($9, installed_at),
         last_checked_at = NOW(),
         updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [name, location, latitude, longitude, stream_url, status, camera_type, notes, installed_at, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Camera not found.' });
    res.json({ camera: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating camera.' });
  }
});

// DELETE /api/cameras/:id - Delete camera
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cctv_cameras WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Camera not found.' });
    res.json({ message: 'Camera deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting camera.' });
  }
});

// GET /api/cameras/map/all - Get cameras with coordinates for map
router.get('/map/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, location, latitude, longitude, status, camera_type, stream_url
       FROM cctv_cameras
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
    );
    res.json({ cameras: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching camera map data.' });
  }
});

module.exports = router;
