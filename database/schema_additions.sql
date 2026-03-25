-- ===== SCHEMA ADDITIONS =====
-- Run this after schema.sql to add new feature tables

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  alert_type VARCHAR(100) NOT NULL,
  related_crime_id INTEGER REFERENCES crimes(id) ON DELETE SET NULL,
  related_person_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
  related_vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id),
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External APIs configuration table
CREATE TABLE IF NOT EXISTS external_apis (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_url VARCHAR(500) NOT NULL,
  api_key_encrypted TEXT,
  headers JSONB,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP,
  sync_interval_minutes INTEGER DEFAULT 60,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CCTV cameras table
CREATE TABLE IF NOT EXISTS cctv_cameras (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  stream_url VARCHAR(1000),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  camera_type VARCHAR(100),
  notes TEXT,
  installed_at TIMESTAMP,
  last_checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import logs table
CREATE TABLE IF NOT EXISTS import_logs (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('excel', 'access', 'csv')),
  target_table VARCHAR(100) NOT NULL,
  records_total INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  errors JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  imported_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_cctv_cameras_status ON cctv_cameras(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status);
