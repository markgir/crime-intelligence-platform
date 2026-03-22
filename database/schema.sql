-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'investigator', 'analyst', 'viewer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People table
CREATE TABLE people (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  id_number VARCHAR(50) UNIQUE,
  nationality VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People addresses table
CREATE TABLE people_addresses (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  address_type VARCHAR(50) NOT NULL CHECK (address_type IN ('residential', 'commercial', 'other')),
  street VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People phones table
CREATE TABLE people_phones (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  phone_type VARCHAR(50) NOT NULL CHECK (phone_type IN ('mobile', 'residential', 'commercial')),
  phone_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Social media profiles table
CREATE TABLE social_media_profiles (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  platform VARCHAR(100) NOT NULL,
  username VARCHAR(255),
  url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  registration_plate VARCHAR(50) UNIQUE NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  color VARCHAR(50),
  vehicle_type VARCHAR(50),
  owner_id INTEGER REFERENCES people(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crime types table
CREATE TABLE crime_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  custom_fields JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crimes table
CREATE TABLE crimes (
  id SERIAL PRIMARY KEY,
  crime_type_id INTEGER REFERENCES crime_types(id),
  location VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  crime_date TIMESTAMP NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'investigating', 'closed')),
  custom_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crime victims table
CREATE TABLE crime_victims (
  id SERIAL PRIMARY KEY,
  crime_id INTEGER REFERENCES crimes(id) ON DELETE CASCADE,
  person_id INTEGER REFERENCES people(id),
  relationship VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crime suspects table
CREATE TABLE crime_suspects (
  id SERIAL PRIMARY KEY,
  crime_id INTEGER REFERENCES crimes(id) ON DELETE CASCADE,
  person_id INTEGER REFERENCES people(id),
  confidence_level VARCHAR(50) CHECK (confidence_level IN ('low', 'medium', 'high')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationships table
CREATE TABLE relationships (
  id SERIAL PRIMARY KEY,
  person_id_1 INTEGER REFERENCES people(id) ON DELETE CASCADE,
  person_id_2 INTEGER REFERENCES people(id) ON DELETE CASCADE,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
  crime_id INTEGER REFERENCES crimes(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drug network relationships
CREATE TABLE drug_network_relationships (
  id SERIAL PRIMARY KEY,
  consumer_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  distributor_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
  substance_type VARCHAR(255),
  quantity DECIMAL(10, 2),
  transaction_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Backups table
CREATE TABLE backups (
  id SERIAL PRIMARY KEY,
  backup_name VARCHAR(255) NOT NULL,
  backup_path VARCHAR(500) NOT NULL,
  backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('automatic', 'manual')),
  file_size BIGINT,
  backup_date TIMESTAMP NOT NULL,
  status VARCHAR(50) CHECK (status IN ('success', 'failed', 'in_progress')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_people_first_name ON people(first_name);
CREATE INDEX idx_people_last_name ON people(last_name);
CREATE INDEX idx_vehicles_registration_plate ON vehicles(registration_plate);
CREATE INDEX idx_crimes_crime_type_id ON crimes(crime_type_id);
CREATE INDEX idx_crimes_crime_date ON crimes(crime_date);
CREATE INDEX idx_relationships_person_id_1 ON relationships(person_id_1);
CREATE INDEX idx_relationships_person_id_2 ON relationships(person_id_2);
CREATE INDEX idx_drug_network_consumer_id ON drug_network_relationships(consumer_id);
CREATE INDEX idx_drug_network_seller_id ON drug_network_relationships(seller_id);
CREATE INDEX idx_drug_network_distributor_id ON drug_network_relationships(distributor_id);