const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/relationships - List all relationships
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
         p1.first_name AS person1_first_name, p1.last_name AS person1_last_name,
         p2.first_name AS person2_first_name, p2.last_name AS person2_last_name,
         v.registration_plate, v.brand, v.model,
         c.location AS crime_location
       FROM relationships r
       LEFT JOIN people p1 ON r.person_id_1 = p1.id
       LEFT JOIN people p2 ON r.person_id_2 = p2.id
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       LEFT JOIN crimes c ON r.crime_id = c.id
       ORDER BY r.created_at DESC`
    );
    res.json({ relationships: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching relationships.' });
  }
});

// POST /api/relationships/person-to-person
router.post('/person-to-person', async (req, res) => {
  const { person_id_1, person_id_2, relationship_type, notes } = req.body;
  if (!person_id_1 || !person_id_2 || !relationship_type) {
    return res.status(400).json({ error: 'person_id_1, person_id_2 and relationship_type are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO relationships (person_id_1, person_id_2, relationship_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [person_id_1, person_id_2, relationship_type, notes || null]
    );
    res.status(201).json({ relationship: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating person-to-person relationship.' });
  }
});

// POST /api/relationships/person-to-vehicle
router.post('/person-to-vehicle', async (req, res) => {
  const { person_id_1, vehicle_id, relationship_type, notes } = req.body;
  if (!person_id_1 || !vehicle_id || !relationship_type) {
    return res.status(400).json({ error: 'person_id_1, vehicle_id and relationship_type are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO relationships (person_id_1, vehicle_id, relationship_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [person_id_1, vehicle_id, relationship_type, notes || null]
    );
    res.status(201).json({ relationship: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating person-to-vehicle relationship.' });
  }
});

// POST /api/relationships/person-to-crime
router.post('/person-to-crime', async (req, res) => {
  const { person_id_1, crime_id, relationship_type, notes } = req.body;
  if (!person_id_1 || !crime_id || !relationship_type) {
    return res.status(400).json({ error: 'person_id_1, crime_id and relationship_type are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO relationships (person_id_1, crime_id, relationship_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [person_id_1, crime_id, relationship_type, notes || null]
    );
    res.status(201).json({ relationship: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating person-to-crime relationship.' });
  }
});

// POST /api/relationships/vehicle-to-crime
router.post('/vehicle-to-crime', async (req, res) => {
  const { vehicle_id, crime_id, relationship_type, notes } = req.body;
  if (!vehicle_id || !crime_id || !relationship_type) {
    return res.status(400).json({ error: 'vehicle_id, crime_id and relationship_type are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO relationships (vehicle_id, crime_id, relationship_type, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [vehicle_id, crime_id, relationship_type, notes || null]
    );
    res.status(201).json({ relationship: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating vehicle-to-crime relationship.' });
  }
});

// PUT /api/relationships/:id - Update relationship
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { relationship_type, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE relationships SET
         relationship_type = COALESCE($1, relationship_type),
         notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING *`,
      [relationship_type, notes, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relationship not found.' });
    }
    res.json({ relationship: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating relationship.' });
  }
});

// DELETE /api/relationships/:id - Delete relationship
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM relationships WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relationship not found.' });
    }
    res.json({ message: 'Relationship deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting relationship.' });
  }
});

// GET /api/relationships/graph/person/:id - Network graph for a person
router.get('/graph/person/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const relationships = await pool.query(
      `SELECT r.*,
         p1.first_name AS person1_first_name, p1.last_name AS person1_last_name,
         p2.first_name AS person2_first_name, p2.last_name AS person2_last_name,
         v.registration_plate, v.brand, v.model,
         c.location AS crime_location, c.description AS crime_description
       FROM relationships r
       LEFT JOIN people p1 ON r.person_id_1 = p1.id
       LEFT JOIN people p2 ON r.person_id_2 = p2.id
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       LEFT JOIN crimes c ON r.crime_id = c.id
       WHERE r.person_id_1 = $1 OR r.person_id_2 = $1`,
      [id]
    );
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();
    const addNode = (nodeId, label, type) => {
      if (!nodeIds.has(`${type}-${nodeId}`)) {
        nodeIds.add(`${type}-${nodeId}`);
        nodes.push({ id: `${type}-${nodeId}`, label, type });
      }
    };
    relationships.rows.forEach(r => {
      if (r.person_id_1) addNode(r.person_id_1, `${r.person1_first_name} ${r.person1_last_name}`, 'person');
      if (r.person_id_2) addNode(r.person_id_2, `${r.person2_first_name} ${r.person2_last_name}`, 'person');
      if (r.vehicle_id) addNode(r.vehicle_id, `${r.brand} ${r.model} (${r.registration_plate})`, 'vehicle');
      if (r.crime_id) addNode(r.crime_id, r.crime_location, 'crime');
      const source = r.person_id_1 ? `person-${r.person_id_1}` : (r.vehicle_id ? `vehicle-${r.vehicle_id}` : null);
      const target = r.person_id_2 ? `person-${r.person_id_2}` : (r.vehicle_id ? `vehicle-${r.vehicle_id}` : (r.crime_id ? `crime-${r.crime_id}` : null));
      if (source && target) {
        edges.push({ id: `edge-${r.id}`, source, target, label: r.relationship_type });
      }
    });
    res.json({ nodes, edges });
  } catch (err) {
    res.status(500).json({ error: 'Error building relationship graph.' });
  }
});

// GET /api/relationships/crime/:crimeId/relationships - All connections for a crime
router.get('/crime/:crimeId/relationships', async (req, res) => {
  const { crimeId } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.*,
         p1.first_name AS person1_first_name, p1.last_name AS person1_last_name,
         v.registration_plate, v.brand, v.model
       FROM relationships r
       LEFT JOIN people p1 ON r.person_id_1 = p1.id
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.crime_id = $1`,
      [crimeId]
    );
    res.json({ relationships: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching crime relationships.' });
  }
});

// GET /api/relationships/drug-network/all - List all drug network entries
router.get('/drug-network/all', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT dn.*,
         c.first_name AS consumer_first_name, c.last_name AS consumer_last_name,
         s.first_name AS seller_first_name, s.last_name AS seller_last_name,
         d.first_name AS distributor_first_name, d.last_name AS distributor_last_name
       FROM drug_network_relationships dn
       LEFT JOIN people c ON dn.consumer_id = c.id
       LEFT JOIN people s ON dn.seller_id = s.id
       LEFT JOIN people d ON dn.distributor_id = d.id
       ORDER BY dn.transaction_date DESC`
    );
    res.json({ drug_network: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching drug network.' });
  }
});

// POST /api/relationships/drug-network - Create drug network entry
router.post('/drug-network', async (req, res) => {
  const { consumer_id, seller_id, distributor_id, substance_type, quantity, transaction_date, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO drug_network_relationships (consumer_id, seller_id, distributor_id, substance_type, quantity, transaction_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [consumer_id || null, seller_id || null, distributor_id || null, substance_type || null, quantity || null, transaction_date || null, notes || null]
    );
    res.status(201).json({ entry: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating drug network entry.' });
  }
});

module.exports = router;
