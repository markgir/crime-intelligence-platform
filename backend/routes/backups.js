const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const cron = require('node-cron');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

router.use(authMiddleware);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Validate that a string is a safe identifier (no shell metacharacters)
const safeEnvVar = (value, fallback) => {
  const val = (value || fallback).replace(/[^a-zA-Z0-9_.\-]/g, '');
  return val || fallback;
};

const createDbBackup = async (backup_name, backup_type) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${backup_name}_${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  const dbUser = safeEnvVar(process.env.DB_USER, 'postgres');
  const dbHost = safeEnvVar(process.env.DB_HOST, 'localhost');
  const dbName = safeEnvVar(process.env.DB_NAME, 'crime_intelligence');
  const dbPort = safeEnvVar(process.env.DB_PORT, '5432');

  // Use spawnSync with an array of arguments to avoid shell injection
  const result = spawnSync('pg_dump', ['-U', dbUser, '-h', dbHost, '-p', dbPort, dbName], {
    env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' },
    encoding: 'buffer',
    maxBuffer: 100 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const errMsg = result.stderr ? result.stderr.toString() : 'pg_dump failed';
    await pool.query(
      `INSERT INTO backups (backup_name, backup_path, backup_type, backup_date, status, notes)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'failed', $4)`,
      [backup_name, filepath, backup_type, errMsg]
    );
    throw new Error(errMsg);
  }

  fs.writeFileSync(filepath, result.stdout);
  const stats = fs.statSync(filepath);
  const dbResult = await pool.query(
    `INSERT INTO backups (backup_name, backup_path, backup_type, file_size, backup_date, status)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'success') RETURNING *`,
    [backup_name, filepath, backup_type, stats.size]
  );
  return dbResult.rows[0];
};

// Schedule automatic backups
const scheduleBackups = () => {
  // Daily at 02:00
  cron.schedule('0 2 * * *', async () => {
    try { await createDbBackup('backup_daily', 'automatic'); } catch (e) { console.error('Daily backup failed:', e.message); }
  });
  // Weekly Sunday at 03:00
  cron.schedule('0 3 * * 0', async () => {
    try { await createDbBackup('backup_weekly', 'automatic'); } catch (e) { console.error('Weekly backup failed:', e.message); }
  });
  // Monthly on 1st at 04:00
  cron.schedule('0 4 1 * *', async () => {
    try { await createDbBackup('backup_monthly', 'automatic'); } catch (e) { console.error('Monthly backup failed:', e.message); }
  });
  // Cleanup backups older than retention days (parameterized)
  cron.schedule('0 5 * * *', async () => {
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30;
    try {
      const old = await pool.query(
        'SELECT * FROM backups WHERE backup_date < NOW() - ($1 || \' days\')::INTERVAL',
        [retentionDays]
      );
      for (const backup of old.rows) {
        try { fs.unlinkSync(backup.backup_path); } catch (e) { /* file may not exist */ }
        await pool.query('DELETE FROM backups WHERE id = $1', [backup.id]);
      }
    } catch (e) { console.error('Backup cleanup failed:', e.message); }
  });
};

scheduleBackups();

// GET /api/backups - List backups
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM backups ORDER BY backup_date DESC');
    res.json({ backups: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching backups.' });
  }
});

// GET /api/backups/statistics/overview
router.get('/statistics/overview', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM backups');
    const success = await pool.query("SELECT COUNT(*) FROM backups WHERE status = 'success'");
    const failed = await pool.query("SELECT COUNT(*) FROM backups WHERE status = 'failed'");
    const totalSize = await pool.query("SELECT COALESCE(SUM(file_size), 0) FROM backups WHERE status = 'success'");
    const latest = await pool.query("SELECT * FROM backups ORDER BY backup_date DESC LIMIT 1");
    res.json({
      total: parseInt(total.rows[0].count),
      success: parseInt(success.rows[0].count),
      failed: parseInt(failed.rows[0].count),
      total_size_bytes: parseInt(totalSize.rows[0].coalesce),
      latest_backup: latest.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching backup statistics.' });
  }
});

// GET /api/backups/:id - Get backup details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM backups WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found.' });
    }
    res.json({ backup: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching backup.' });
  }
});

// GET /api/backups/:id/logs
router.get('/:id/logs', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM backups WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found.' });
    }
    res.json({ backup_id: id, notes: result.rows[0].notes, status: result.rows[0].status });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching backup logs.' });
  }
});

// GET /api/backups/:id/status
router.get('/:id/status', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, status, backup_date FROM backups WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found.' });
    }
    res.json({ backup_id: id, status: result.rows[0].status, backup_date: result.rows[0].backup_date });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching backup status.' });
  }
});

// POST /api/backups/manual - Create manual backup
router.post('/manual', requireRole('admin', 'investigator'), async (req, res) => {
  const { backup_name } = req.body;
  const name = backup_name || `manual_backup_${Date.now()}`;
  try {
    const backup = await createDbBackup(name, 'manual');
    res.status(201).json({ backup });
  } catch (err) {
    res.status(500).json({ error: 'Backup creation failed.', details: err.message });
  }
});

// POST /api/backups/automatic - Trigger automatic backup
router.post('/automatic', requireRole('admin'), async (req, res) => {
  const { backup_name } = req.body;
  const name = backup_name || `auto_backup_${Date.now()}`;
  try {
    const backup = await createDbBackup(name, 'automatic');
    res.status(201).json({ backup });
  } catch (err) {
    res.status(500).json({ error: 'Backup creation failed.', details: err.message });
  }
});

// POST /api/backups/restore/:id - Restore a backup
router.post('/restore/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM backups WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found.' });
    }
    const backup = result.rows[0];
    if (!fs.existsSync(backup.backup_path)) {
      return res.status(404).json({ error: 'Backup file not found on disk.' });
    }
    const dbUser = safeEnvVar(process.env.DB_USER, 'postgres');
    const dbHost = safeEnvVar(process.env.DB_HOST, 'localhost');
    const dbName = safeEnvVar(process.env.DB_NAME, 'crime_intelligence');
    const dbPort = safeEnvVar(process.env.DB_PORT, '5432');
    const sqlContent = fs.readFileSync(backup.backup_path);
    const restoreResult = spawnSync('psql', ['-U', dbUser, '-h', dbHost, '-p', dbPort, dbName], {
      input: sqlContent,
      env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || '' },
      encoding: 'buffer',
    });
    if (restoreResult.status !== 0) {
      const errMsg = restoreResult.stderr ? restoreResult.stderr.toString() : 'psql restore failed';
      return res.status(500).json({ error: 'Restore failed.', details: errMsg });
    }
    res.json({ message: `Backup ${backup.backup_name} restored successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Restore failed.', details: err.message });
  }
});

// DELETE /api/backups/:id - Delete backup
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM backups WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found.' });
    }
    const backup = result.rows[0];
    try { fs.unlinkSync(backup.backup_path); } catch (e) { /* file may not exist */ }
    await pool.query('DELETE FROM backups WHERE id = $1', [id]);
    res.json({ message: 'Backup deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting backup.' });
  }
});

module.exports = router;
