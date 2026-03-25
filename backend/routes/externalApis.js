const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');
const pool = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/external-apis - List configured APIs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, base_url, is_active, last_synced_at, sync_interval_minutes, created_at
       FROM external_apis ORDER BY name`
    );
    res.json({ apis: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching external APIs.' });
  }
});

// POST /api/external-apis - Create API config
router.post('/', requireRole('admin', 'investigator'), async (req, res) => {
  const { name, description, base_url, api_key, headers, sync_interval_minutes } = req.body;
  if (!name || !base_url) {
    return res.status(400).json({ error: 'name and base_url are required.' });
  }
  try {
    new URL(base_url);
  } catch (_) {
    return res.status(400).json({ error: 'Invalid base_url.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO external_apis (name, description, base_url, api_key_encrypted, headers, sync_interval_minutes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, description, base_url, is_active, sync_interval_minutes, created_at`,
      [name, description || null, base_url, api_key || null, headers ? JSON.stringify(headers) : null, sync_interval_minutes || 60, req.user.id]
    );
    res.status(201).json({ api: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creating external API config.' });
  }
});

// PUT /api/external-apis/:id - Update API config
router.put('/:id', requireRole('admin', 'investigator'), async (req, res) => {
  const { id } = req.params;
  const { name, description, base_url, api_key, headers, is_active, sync_interval_minutes } = req.body;
  if (base_url) {
    try { new URL(base_url); } catch (_) {
      return res.status(400).json({ error: 'Invalid base_url.' });
    }
  }
  try {
    const result = await pool.query(
      `UPDATE external_apis SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         base_url = COALESCE($3, base_url),
         api_key_encrypted = COALESCE($4, api_key_encrypted),
         headers = COALESCE($5, headers),
         is_active = COALESCE($6, is_active),
         sync_interval_minutes = COALESCE($7, sync_interval_minutes),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, name, description, base_url, is_active, sync_interval_minutes, updated_at`,
      [name, description, base_url, api_key, headers ? JSON.stringify(headers) : null, is_active, sync_interval_minutes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'API config not found.' });
    res.json({ api: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error updating external API config.' });
  }
});

// DELETE /api/external-apis/:id - Delete API config
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM external_apis WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'API config not found.' });
    res.json({ message: 'API config deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting external API config.' });
  }
});

// POST /api/external-apis/:id/test - Test API connectivity
router.post('/:id/test', requireRole('admin', 'investigator'), async (req, res) => {
  const { id } = req.params;
  try {
    const apiResult = await pool.query('SELECT * FROM external_apis WHERE id = $1', [id]);
    if (apiResult.rows.length === 0) return res.status(404).json({ error: 'API config not found.' });
    const apiConfig = apiResult.rows[0];
    const { endpoint = '/' } = req.body;

    // Validate endpoint is a relative path only (prevent SSRF)
    const endpointStr = String(endpoint || '/');
    if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(endpointStr)) {
      return res.status(400).json({ error: 'endpoint must be a relative path, not an absolute URL.' });
    }

    const base = new URL(apiConfig.base_url);
    // Build the target URL anchored to the configured base
    const target = new URL(endpointStr, base.origin);
    // Ensure the hostname matches the configured base URL (prevent SSRF via path traversal)
    if (target.hostname !== base.hostname || target.port !== base.port) {
      return res.status(400).json({ error: 'endpoint resolves outside the configured base URL.' });
    }
    const proto = target.protocol === 'https:' ? https : http;

    const reqHeaders = {
      'Accept': 'application/json',
      'User-Agent': 'CrimeIntelligencePlatform/1.0',
    };
    if (apiConfig.headers) {
      Object.assign(reqHeaders, apiConfig.headers);
    }
    if (apiConfig.api_key_encrypted) {
      reqHeaders['Authorization'] = `Bearer ${apiConfig.api_key_encrypted}`;
    }

    const testResult = await new Promise((resolve, reject) => {
      const reqOptions = {
        hostname: target.hostname,
        port: target.port || (target.protocol === 'https:' ? 443 : 80),
        path: target.pathname + target.search,
        method: 'GET',
        headers: reqHeaders,
        timeout: 10000,
      };
      const request = proto.request(reqOptions, (response) => {
        let body = '';
        response.on('data', (chunk) => { body += chunk; });
        response.on('end', () => {
          resolve({ status: response.statusCode, body: body.slice(0, 500) });
        });
      });
      request.on('error', reject);
      request.on('timeout', () => { request.destroy(); reject(new Error('Request timed out')); });
      request.end();
    });

    await pool.query('UPDATE external_apis SET last_synced_at = NOW() WHERE id = $1', [id]);
    res.json({ success: true, status: testResult.status, preview: testResult.body });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
