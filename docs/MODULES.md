# Modules

## Module 1 – Authentication & Security
JWT-based authentication with 24h access tokens and 7-day refresh tokens. Role-based access control (RBAC) with four roles: `admin`, `investigator`, `analyst`, `viewer`. Passwords hashed with bcrypt (10+ rounds). Helmet.js security headers and CORS configured. All API routes protected by `authMiddleware`.

## Module 2 – People Management
Full CRUD for person records with pagination and full-text search by name, ID number and nationality. Each person can have multiple addresses (residential/commercial/other), multiple phone numbers (mobile/residential/commercial) and multiple social media profiles (Twitter, Facebook, Instagram, etc.).

## Module 3 – Vehicle Management
Full CRUD for vehicles with unique registration plates. Vehicles can be linked to owner persons. Supports plate search (partial match), owner update endpoint, and association with crimes and relationships.

## Module 4 – Crime Management
Dynamic crime type system (customizable, with optional JSON custom fields). Crime records include location, GPS coordinates (latitude/longitude), date/time, description and status (open / investigating / closed). Each crime can have multiple victims and suspects, with confidence levels (low/medium/high) for suspects.

## Module 5 – Relationships
Many-to-many relationship mapping between:
- Person ↔ Person (friends, colleagues, associates)
- Person ↔ Vehicle (owner, driver, passenger)
- Person ↔ Crime (victim, suspect, witness)
- Vehicle ↔ Crime (used, targeted, escape)
Force-directed network graph API for visualising connections around a specific person or crime.

## Module 6 – Drug Network
Tracks supply chain relationships between consumers, sellers and distributors. Records substance types, quantities and transaction dates. Supports complex multi-hop distribution chains and traffic flow analysis.

## Module 7 – OSINT Dashboard
Real-time statistics cards (total people, vehicles, crimes, open cases, resolution rate). Interactive charts: line chart of crimes by month, pie chart of crimes by type, bar chart of top crime locations, bar chart of crime status distribution. Built with Recharts.

## Module 8 – Backup System
Manual on-demand backups and automated scheduled backups:
- Hourly (every hour)
- Daily (02:00 AM)
- Weekly (Sunday 03:00 AM)
- Monthly (1st day 04:00 AM)
Automatic cleanup of backups older than the configured retention period (default 30 days). Restore capability. Statistics overview (total, success, failed, total size). Uses `pg_dump`/`psql` for PostgreSQL backups.

## Module 9 – API Layer
60+ RESTful API endpoints covering all modules. Parameterized SQL queries for SQL injection prevention. Consistent JSON responses with error codes. Input validation on all create/update operations.

## Module 10 – Frontend SPA
React 18 single-page application with React Router v6 for client-side navigation. Dark OSINT-themed UI with CSS variables. Axios HTTP client with automatic JWT injection and 401 redirect. All forms use controlled components with error handling.

## Module 11 – Role-Based Access Control (RBAC)
Four permission levels:
- `admin` – full access including backups, restore, delete
- `investigator` – CRUD on all investigative data, manual backups
- `analyst` – read/write on analytics data
- `viewer` – read-only access

## Module 12 – Installation & DevOps
One-line install script. PM2 process manager ecosystem configuration. Environment-variable-based configuration for database credentials, JWT secrets and backup retention. Supports Docker containerisation (optional). Node.js v14+ backend with Express.js. PostgreSQL 12+ database with indexed schema.
