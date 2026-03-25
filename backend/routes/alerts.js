const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/alerts - List alerts
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, status, severity } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;
  if (status) { conditions.push(`a.status = $${idx}`); params.push(status); idx++; }
  if (severity) { conditions.push(`a.severity = $${idx}`); params.push(severity); idx++; }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const result = await pool.query(
      `SELECT a.*,
              u1.username AS created_by_username,
              u2.username AS acknowledged_by_username
       FROM alerts a
       LEFT JOIN users u1 ON a.created_by = u1.id
       LEFT JOIN users u2 ON a.acknowledged_by = u2.id
       ${where}
       ORDER BY
         CASE a.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         a.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );
    const countResult = await pool.query(`SELECT COUNT(*) FROM alerts a ${where}`, params);
    res.json({ alerts: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching alerts.' });
  }
});

// GET /api/alerts/stats - Alert statistics
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'acknowledged') AS acknowledged,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'active') AS critical_active,
        COUNT(*) FILTER (WHERE severity = 'high' AND status = 'active') AS high_active,
        COUNT(*) AS total
      FROM alerts
    `);
    res.json({ stats: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching alert stats.' });
  }
});

// POST /api/alerts - Create alert
router.post('/', requireRole('admin', 'investigator', 'analyst'), async (req, res) => {
  const { title, description, severity, alert_type, related_crime_id, related_person_id, related_vehicle_id } = req.body;
  if (!title || !severity || !alert_type) {
    return res.status(400).json({ error: 'title, severity and alert_type are required.' });
  }
  if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
    return res.status(400).json({ error: 'severity must be low, medium, high or critical.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO alerts (title, description, severity, alert_type, related_crime_id, related_person_id, related_vehicle_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description || null, severity, alert_type, related_crime_id || null, related_person_id || null, related_vehicle_id || null, req.user.id]
    );
    res.status(201).json({ alert: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating alert.' });
  }
});

// PUT /api/alerts/:id/acknowledge - Acknowledge alert
router.put('/:id/acknowledge', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE alerts SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'active' RETURNING *`,
      [req.user.id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found or already acknowledged.' });
    }
    res.json({ alert: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error acknowledging alert.' });
  }
});

// PUT /api/alerts/:id/resolve - Resolve alert
router.put('/:id/resolve', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE alerts SET status = 'resolved', resolved_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status != 'resolved' RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found or already resolved.' });
    }
    res.json({ alert: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error resolving alert.' });
  }
});

// PUT /api/alerts/:id - Update alert
router.put('/:id', requireRole('admin', 'investigator'), async (req, res) => {
  const { id } = req.params;
  const { title, description, severity, alert_type, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE alerts SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         severity = COALESCE($3, severity),
         alert_type = COALESCE($4, alert_type),
         status = COALESCE($5, status),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description, severity, alert_type, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ alert: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating alert.' });
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting alert.' });
  }
});

module.exports = router;
