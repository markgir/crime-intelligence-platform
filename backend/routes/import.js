const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const upload = multer({
  dest: path.join(__dirname, '../tmp/uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are supported.'));
    }
  },
});

// Ensure tmp dir exists
const tmpDir = path.join(__dirname, '../tmp/uploads');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

const SUPPORTED_TARGETS = ['people', 'vehicles', 'crimes'];

const COLUMN_MAPS = {
  people: {
    'first_name': ['first_name', 'primeiro_nome', 'nome', 'name', 'first name'],
    'last_name': ['last_name', 'apelido', 'sobrenome', 'surname', 'last name'],
    'date_of_birth': ['date_of_birth', 'dob', 'data_nascimento', 'birthdate'],
    'id_number': ['id_number', 'bi', 'nif', 'cc', 'id number', 'identification'],
    'nationality': ['nationality', 'nacionalidade'],
    'notes': ['notes', 'notas', 'obs', 'observations'],
  },
  vehicles: {
    'registration_plate': ['registration_plate', 'plate', 'matricula', 'placa', 'license plate'],
    'brand': ['brand', 'marca', 'make'],
    'model': ['model', 'modelo'],
    'color': ['color', 'cor', 'colour'],
    'vehicle_type': ['vehicle_type', 'type', 'tipo', 'tipo_veiculo'],
    'notes': ['notes', 'notas'],
  },
  crimes: {
    'location': ['location', 'localizacao', 'local', 'address'],
    'latitude': ['latitude', 'lat'],
    'longitude': ['longitude', 'lon', 'lng'],
    'crime_date': ['crime_date', 'date', 'data', 'data_crime'],
    'description': ['description', 'descricao', 'descricão'],
    'status': ['status', 'estado'],
  },
};

function normalizeHeader(header) {
  return String(header || '').toLowerCase().trim().replace(/\s+/g, '_');
}

function mapRow(row, target) {
  const colMap = COLUMN_MAPS[target];
  const mapped = {};
  for (const [field, aliases] of Object.entries(colMap)) {
    for (const [key, val] of Object.entries(row)) {
      if (aliases.includes(normalizeHeader(key))) {
        mapped[field] = val !== undefined && val !== null ? String(val).trim() : null;
        break;
      }
    }
  }
  return mapped;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function insertPerson(client, data) {
  if (!data.first_name || !data.last_name) {
    throw new Error('first_name and last_name are required for people.');
  }
  const dob = parseDate(data.date_of_birth);
  const result = await client.query(
    `INSERT INTO people (first_name, last_name, date_of_birth, id_number, nationality, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id_number) DO NOTHING RETURNING id`,
    [data.first_name, data.last_name, dob, data.id_number || null, data.nationality || null, data.notes || null]
  );
  return result.rows.length > 0;
}

async function insertVehicle(client, data) {
  if (!data.registration_plate || !data.brand || !data.model) {
    throw new Error('registration_plate, brand and model are required for vehicles.');
  }
  const result = await client.query(
    `INSERT INTO vehicles (registration_plate, brand, model, color, vehicle_type, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (registration_plate) DO NOTHING RETURNING id`,
    [data.registration_plate, data.brand, data.model, data.color || null, data.vehicle_type || null, data.notes || null]
  );
  return result.rows.length > 0;
}

async function insertCrime(client, data) {
  if (!data.location || !data.crime_date || !data.description) {
    throw new Error('location, crime_date and description are required for crimes.');
  }
  const crimeDate = parseDate(data.crime_date);
  if (!crimeDate) {
    throw new Error(`Invalid crime_date: "${data.crime_date}".`);
  }
  const status = ['open', 'investigating', 'closed'].includes(data.status) ? data.status : 'open';
  await client.query(
    `INSERT INTO crimes (location, latitude, longitude, crime_date, description, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [data.location, data.latitude || null, data.longitude || null, crimeDate, data.description, status]
  );
  return true;
}

const INSERTERS = { people: insertPerson, vehicles: insertVehicle, crimes: insertCrime };

// POST /api/import/excel - Upload and import Excel/CSV file
router.post('/excel', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const target = (req.body.target || '').toLowerCase();
  if (!SUPPORTED_TARGETS.includes(target)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: `target must be one of: ${SUPPORTED_TARGETS.join(', ')}` });
  }

  const filePath = req.file.path;
  const filename = req.file.originalname;
  let importLog;

  try {
    // Create import log entry
    const logResult = await pool.query(
      `INSERT INTO import_logs (filename, import_type, target_table, status, imported_by)
       VALUES ($1, 'excel', $2, 'processing', $3) RETURNING id`,
      [filename, target, req.user.id]
    );
    importLog = logResult.rows[0].id;

    const workbook = new ExcelJS.Workbook();
    const ext = path.extname(filename).toLowerCase();

    if (ext === '.csv') {
      await workbook.csv.readFile(filePath);
    } else {
      await workbook.xlsx.readFile(filePath);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in the file.');
    }

    // Extract headers from first row
    const headers = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value);
    });

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber - 1]] = cell.value;
      });
      rows.push(rowData);
    });

    let imported = 0;
    let failed = 0;
    const errors = [];
    const inserter = INSERTERS[target];
    const client = await pool.connect();

    try {
      for (let i = 0; i < rows.length; i++) {
        const mapped = mapRow(rows[i], target);
        try {
          await client.query('BEGIN');
          const inserted = await inserter(client, mapped);
          await client.query('COMMIT');
          if (inserted) imported++;
        } catch (rowErr) {
          await client.query('ROLLBACK');
          failed++;
          errors.push({ row: i + 2, error: rowErr.message });
        }
      }
    } finally {
      client.release();
    }

    await pool.query(
      `UPDATE import_logs SET records_total=$1, records_imported=$2, records_failed=$3, errors=$4, status='completed', completed_at=NOW()
       WHERE id=$5`,
      [rows.length, imported, failed, JSON.stringify(errors), importLog]
    );

    res.json({
      message: 'Import completed.',
      total: rows.length,
      imported,
      failed,
      errors: errors.slice(0, 20),
      import_log_id: importLog,
    });
  } catch (err) {
    if (importLog) {
      await pool.query(
        `UPDATE import_logs SET status='failed', errors=$1, completed_at=NOW() WHERE id=$2`,
        [JSON.stringify([{ error: err.message }]), importLog]
      );
    }
    res.status(500).json({ error: err.message || 'Error processing file.' });
  } finally {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
});

// GET /api/import/logs - List import history
router.get('/logs', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `SELECT il.*, u.username AS imported_by_username
       FROM import_logs il LEFT JOIN users u ON il.imported_by = u.id
       ORDER BY il.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM import_logs');
    res.json({ logs: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching import logs.' });
  }
});

module.exports = router;
