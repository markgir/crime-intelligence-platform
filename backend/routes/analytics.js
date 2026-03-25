const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/analytics/patterns - Crime pattern analysis
router.get('/patterns', async (req, res) => {
  try {
    const [
      hotspots,
      timePatterns,
      suspectNetwork,
      recidivism,
      crimeVelocity,
    ] = await Promise.all([
      // Top crime hotspots
      pool.query(`
        SELECT location, COUNT(*) AS crime_count,
               AVG(latitude) AS avg_lat, AVG(longitude) AS avg_lon
        FROM crimes
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        GROUP BY location
        ORDER BY crime_count DESC
        LIMIT 10
      `),

      // Crime by hour of day
      pool.query(`
        SELECT EXTRACT(HOUR FROM crime_date) AS hour,
               COUNT(*) AS count
        FROM crimes
        GROUP BY hour
        ORDER BY hour
      `),

      // People with most criminal connections (suspects)
      pool.query(`
        SELECT p.id, p.first_name, p.last_name,
               COUNT(DISTINCT cs.crime_id) AS crime_count,
               MAX(cs.confidence_level) AS max_confidence
        FROM people p
        JOIN crime_suspects cs ON cs.person_id = p.id
        GROUP BY p.id, p.first_name, p.last_name
        ORDER BY crime_count DESC
        LIMIT 10
      `),

      // People who appear in multiple crimes (recidivism proxy)
      pool.query(`
        SELECT p.id, p.first_name, p.last_name,
               COUNT(DISTINCT cs.crime_id) AS suspect_count,
               COUNT(DISTINCT cv.crime_id) AS victim_count
        FROM people p
        LEFT JOIN crime_suspects cs ON cs.person_id = p.id
        LEFT JOIN crime_victims cv ON cv.person_id = p.id
        GROUP BY p.id, p.first_name, p.last_name
        HAVING COUNT(DISTINCT cs.crime_id) > 1
        ORDER BY suspect_count DESC
        LIMIT 10
      `),

      // Crime velocity: new crimes per week over last 12 weeks
      pool.query(`
        SELECT DATE_TRUNC('week', crime_date) AS week,
               COUNT(*) AS count
        FROM crimes
        WHERE crime_date >= NOW() - INTERVAL '12 weeks'
        GROUP BY week
        ORDER BY week
      `),
    ]);

    // Day-of-week pattern
    const dowResult = await pool.query(`
      SELECT TO_CHAR(crime_date, 'Dy') AS day_of_week,
             EXTRACT(DOW FROM crime_date) AS dow_num,
             COUNT(*) AS count
      FROM crimes
      GROUP BY day_of_week, dow_num
      ORDER BY dow_num
    `);

    // Crime type trends over last 6 months
    const typeTrendsResult = await pool.query(`
      SELECT ct.name AS crime_type,
             DATE_TRUNC('month', c.crime_date) AS month,
             COUNT(*) AS count
      FROM crimes c
      JOIN crime_types ct ON c.crime_type_id = ct.id
      WHERE c.crime_date >= NOW() - INTERVAL '6 months'
      GROUP BY ct.name, month
      ORDER BY month, ct.name
    `);

    // Severity score: crimes with high-confidence suspects unresolved
    const riskResult = await pool.query(`
      SELECT p.id, p.first_name, p.last_name,
             COUNT(cs.id) AS open_suspect_cases,
             SUM(CASE cs.confidence_level WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END) AS risk_score
      FROM people p
      JOIN crime_suspects cs ON cs.person_id = p.id
      JOIN crimes c ON cs.crime_id = c.id
      WHERE c.status != 'closed'
      GROUP BY p.id, p.first_name, p.last_name
      ORDER BY risk_score DESC
      LIMIT 10
    `);

    res.json({
      hotspots: hotspots.rows,
      time_patterns: timePatterns.rows,
      day_of_week_patterns: dowResult.rows,
      suspect_network: suspectNetwork.rows,
      recidivism: recidivism.rows,
      crime_velocity: crimeVelocity.rows,
      crime_type_trends: typeTrendsResult.rows,
      risk_assessment: riskResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error running pattern analysis.' });
  }
});

// GET /api/analytics/geoheatmap - Crime density for heatmap
router.get('/geoheatmap', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT latitude, longitude, COUNT(*) AS intensity
      FROM crimes
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      GROUP BY latitude, longitude
    `);
    const points = result.rows.map(r => ({
      lat: parseFloat(r.latitude),
      lon: parseFloat(r.longitude),
      intensity: parseInt(r.intensity),
    }));
    res.json({ points });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching heatmap data.' });
  }
});

// GET /api/analytics/crimes-map - All crimes with geo data for map
router.get('/crimes-map', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.location, c.latitude, c.longitude, c.crime_date, c.status, c.description,
             ct.name AS crime_type_name
      FROM crimes c
      LEFT JOIN crime_types ct ON c.crime_type_id = ct.id
      WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL
      ORDER BY c.crime_date DESC
    `);
    res.json({ crimes: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching map data.' });
  }
});

module.exports = router;
