#!/bin/bash

# Crime Intelligence Platform – Install / Setup Script
#
# QUICK START (zero-intervention):
#   bash install.sh setup
#
# Other commands:
#   bash install.sh {install|uninstall|reinstall|start|stop}

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Default admin account (shown at the end of setup)
DEFAULT_USER="admin"
DEFAULT_EMAIL="admin@crime-intelligence.local"

# ── Helpers ──────────────────────────────────────────────────────────────────
print_step() { echo ""; echo "──────────────────────────────────────────────"; echo "  $1"; echo "──────────────────────────────────────────────"; }
print_ok()   { echo "  ✅ $1"; }
print_warn() { echo "  ⚠️  $1"; }
print_err()  { echo "  ❌ $1"; }
print_info() { echo "  ℹ  $1"; }

# ── OS detection ─────────────────────────────────────────────────────────────
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ -f /etc/debian_version ]]; then
        OS="debian"
    elif [[ -f /etc/redhat-release ]]; then
        OS="redhat"
    else
        OS="unknown"
    fi
}

# ── Install Node.js ───────────────────────────────────────────────────────────
install_nodejs() {
    if command -v node >/dev/null 2>&1; then
        print_ok "Node.js already installed: $(node --version)"
        return 0
    fi
    print_info "Node.js not found – installing..."
    case "$OS" in
        macos)
            if ! command -v brew >/dev/null 2>&1; then
                print_info "Installing Homebrew first..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install node
            ;;
        debian)
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
            sudo apt-get install -y nodejs >/dev/null 2>&1
            ;;
        redhat)
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - >/dev/null 2>&1
            sudo yum install -y nodejs >/dev/null 2>&1
            ;;
        *)
            print_err "Cannot auto-install Node.js on this OS. Install Node.js v14+ manually, then re-run."
            exit 1
            ;;
    esac
    print_ok "Node.js installed: $(node --version)"
}

# ── Install PostgreSQL ────────────────────────────────────────────────────────
install_postgresql() {
    if command -v psql >/dev/null 2>&1; then
        print_ok "PostgreSQL already installed: $(psql --version | head -1)"
        return 0
    fi
    print_info "PostgreSQL not found – installing..."
    case "$OS" in
        macos)
            brew install postgresql@15
            brew services start postgresql@15
            # Make psql available on PATH
            export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
            ;;
        debian)
            sudo apt-get install -y postgresql postgresql-contrib >/dev/null 2>&1
            sudo systemctl start postgresql
            sudo systemctl enable postgresql >/dev/null 2>&1
            ;;
        redhat)
            sudo yum install -y postgresql-server postgresql-contrib >/dev/null 2>&1
            sudo postgresql-setup initdb >/dev/null 2>&1
            sudo systemctl start postgresql
            sudo systemctl enable postgresql >/dev/null 2>&1
            ;;
        *)
            print_err "Cannot auto-install PostgreSQL on this OS. Install PostgreSQL 12+ manually, then re-run."
            exit 1
            ;;
    esac
    print_ok "PostgreSQL installed."
}

# ── Generate a random hex string (safe in all shell/SQL/env contexts) ─────────
gen_hex() {
    # $1 = number of bytes → $1*2 hex chars
    node -e "process.stdout.write(require('crypto').randomBytes(${1:-24}).toString('hex'))"
}

# ── SETUP – fully automated, zero-intervention ──────────────────────────────
setup() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║       Crime Intelligence Platform – Automated Setup             ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"

    # ── 1. Prerequisites ──────────────────────────────────────────────────────
    print_step "1/8  Checking prerequisites..."
    detect_os
    install_nodejs
    install_postgresql

    # ── 2. npm dependencies ───────────────────────────────────────────────────
    print_step "2/8  Installing Node.js dependencies..."
    ( cd "$BACKEND_DIR"  && npm install --loglevel=error )
    print_ok "Backend dependencies installed."
    ( cd "$FRONTEND_DIR" && npm install --loglevel=error )
    print_ok "Frontend dependencies installed."

    # ── 3. Build frontend ─────────────────────────────────────────────────────
    print_step "3/8  Building frontend for production..."
    ( cd "$FRONTEND_DIR" && npm run build --loglevel=error )
    print_ok "Frontend built."

    # ── 4. Generate secrets ───────────────────────────────────────────────────
    print_step "4/8  Generating secure secrets..."
    JWT_SECRET=$(gen_hex 48)
    JWT_REFRESH_SECRET=$(gen_hex 48)
    DB_PASSWORD=$(gen_hex 16)
    ADMIN_PASSWORD=$(gen_hex 12)
    print_ok "Secrets generated."

    # ── 5. Configure PostgreSQL ───────────────────────────────────────────────
    print_step "5/8  Configuring PostgreSQL..."

    # Attempt to set the postgres user's password (best-effort).
    # DB_PASSWORD is generated with gen_hex (hex chars only) – safe for SQL interpolation.
    if sudo -n -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';" >/dev/null 2>&1; then
        print_ok "PostgreSQL password configured."
        PG_CMD_PREFIX="PGPASSWORD=$DB_PASSWORD"
    elif PGPASSWORD="$DB_PASSWORD" psql -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
        print_ok "PostgreSQL connection verified with generated password."
        PG_CMD_PREFIX="PGPASSWORD=$DB_PASSWORD"
    elif psql -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
        # Trust / peer auth – no password needed; keep DB_PASSWORD for .env but it won't be checked
        print_warn "PostgreSQL using peer/trust auth – DB_PASSWORD in .env is for reference only."
        PG_CMD_PREFIX=""
    else
        print_warn "Could not verify PostgreSQL connection. Check pg_hba.conf and re-run if needed."
        PG_CMD_PREFIX=""
    fi

    # ── 6. Write .env files ───────────────────────────────────────────────────
    print_step "6/8  Writing configuration files..."

    cat > "$BACKEND_DIR/.env" << ENVEOF
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crime_intelligence
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
PORT=5000
NODE_ENV=production
BACKUP_RETENTION_DAYS=30
BACKUP_DIR=./backups
ENVEOF

    cat > "$FRONTEND_DIR/.env" << ENVEOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_STORAGE_KEY=token
ENVEOF

    print_ok "Configuration files written."

    # ── 7. Create & seed database ─────────────────────────────────────────────
    print_step "7/8  Setting up database..."

    # Helper: run psql as superuser, using the auth method established in step 5.
    # Falls back to sudo -u postgres if password-based auth is unavailable.
    run_psql() {
        if [ -n "$PG_CMD_PREFIX" ]; then
            eval "${PG_CMD_PREFIX} psql -U postgres $*"
        else
            psql -U postgres "$@" 2>/dev/null || sudo -u postgres psql "$@"
        fi
    }

    # Create database if it does not already exist
    DB_EXISTS=$(run_psql -tAc "SELECT 1 FROM pg_database WHERE datname='crime_intelligence'" 2>/dev/null || true)
    if [ "$DB_EXISTS" = "1" ]; then
        print_info "Database 'crime_intelligence' already exists."
    else
        ( run_psql -c "CREATE DATABASE crime_intelligence;" 2>/dev/null ) || \
        sudo -u postgres psql -c "CREATE DATABASE crime_intelligence;" >/dev/null 2>&1 || true
        print_ok "Database 'crime_intelligence' created."
    fi

    # Apply schema (schema.sql uses plain CREATE TABLE without IF NOT EXISTS;
    # errors on duplicate objects are expected on re-runs – ignore them with || true)
    ( run_psql -d crime_intelligence -v ON_ERROR_STOP=0 -q \
        -f "$APP_DIR/database/schema.sql" 2>/dev/null ) || \
    sudo -u postgres psql -d crime_intelligence -v ON_ERROR_STOP=0 -q \
        -f "$APP_DIR/database/schema.sql" 2>/dev/null || true
    print_ok "Database schema applied."

    # Apply additional schema additions (schema_additions.sql uses IF NOT EXISTS – always safe)
    if [ -f "$APP_DIR/database/schema_additions.sql" ]; then
        ( run_psql -d crime_intelligence -v ON_ERROR_STOP=0 -q \
            -f "$APP_DIR/database/schema_additions.sql" 2>/dev/null ) || \
        sudo -u postgres psql -d crime_intelligence -v ON_ERROR_STOP=0 -q \
            -f "$APP_DIR/database/schema_additions.sql" 2>/dev/null || true
        print_ok "Additional schema applied."
    fi

    # Seed default admin user (password is passed via environment variable, not argv,
    # so it is not visible in process listings).
    SEED_OUTPUT=$(cd "$BACKEND_DIR" && SEED_ADMIN_PASSWORD="$ADMIN_PASSWORD" \
        node "$APP_DIR/backend/scripts/seed-admin.js" \
        "$DEFAULT_USER" "$DEFAULT_EMAIL" 2>&1)
    if echo "$SEED_OUTPUT" | grep -q "^OK:"; then
        print_ok "Default admin user created."
    else
        print_warn "Could not seed admin user automatically: $SEED_OUTPUT"
        print_info "You can create it manually after startup using the /api/auth/register endpoint."
    fi

    # Create backups directory
    mkdir -p "$BACKEND_DIR/backups"

    # ── 8. Install PM2 and start app ──────────────────────────────────────────
    print_step "8/8  Starting Crime Intelligence Platform..."

    npm install -g pm2 --loglevel=error 2>/dev/null || \
    sudo npm install -g pm2 --loglevel=error 2>/dev/null || true

    if command -v pm2 >/dev/null 2>&1; then
        cd "$APP_DIR"
        pm2 delete crime-intelligence-backend 2>/dev/null || true
        pm2 start "$APP_DIR/ecosystem.config.js"
        pm2 save --force >/dev/null 2>&1 || true
        print_ok "Application started with PM2."
    else
        # Fallback: start in background with nohup
        cd "$BACKEND_DIR"
        nohup node "$BACKEND_DIR/server.js" >> "$APP_DIR/server.log" 2>&1 &
        APP_PID=$!
        print_ok "Application started in background (PID: $APP_PID)."
        print_info "Logs: $APP_DIR/server.log"
    fi

    # Wait for the server to become ready (up to 30 s)
    print_info "Waiting for server to become ready..."
    READY=0
    for i in $(seq 1 30); do
        if curl -sf http://localhost:5000/api/health >/dev/null 2>&1; then
            READY=1
            break
        fi
        sleep 1
    done

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                  🎉  SETUP COMPLETE!  🎉                        ║"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    echo "║                                                                  ║"
    if [ "$READY" -eq 1 ]; then
    echo "║  🟢 Server is UP and running.                                    ║"
    else
    echo "║  🟡 Server is starting – check logs if it does not respond.      ║"
    fi
    echo "║                                                                  ║"
    echo "║  🌐  API Backend   →  http://localhost:5000                      ║"
    echo "║  🌐  Frontend      →  http://localhost:3000  (npm start)         ║"
    echo "║                                                                  ║"
    echo "║  🔐  Default Admin Credentials                                   ║"
    printf  "║      Username : %-49s ║\n" "$DEFAULT_USER"
    printf  "║      Password : %-49s ║\n" "$ADMIN_PASSWORD"
    echo "║                                                                  ║"
    echo "║  ⚠️   IMPORTANT: Change the admin password after first login!    ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
}

# ── INSTALL (dependencies only – prerequisites must already be present) ───────
install() {
    print_step "Installing Crime Intelligence Platform..."

    # Check prerequisites
    command -v node >/dev/null 2>&1 || { print_err "Node.js is required. Run: bash install.sh setup"; exit 1; }
    command -v npm  >/dev/null 2>&1 || { print_err "npm is required."; exit 1; }
    command -v psql >/dev/null 2>&1 || { print_err "PostgreSQL (psql) is required. Run: bash install.sh setup"; exit 1; }

    print_step "Installing backend dependencies..."
    cd "$BACKEND_DIR" && npm install

    print_step "Installing frontend dependencies..."
    cd "$FRONTEND_DIR" && npm install

    print_step "Building frontend..."
    cd "$FRONTEND_DIR" && npm run build

    # Create .env files if they don't exist
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_step "Creating backend .env file..."
        cat > "$BACKEND_DIR/.env" << 'EOF'
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crime_intelligence
JWT_SECRET=change-this-secret-in-production
JWT_REFRESH_SECRET=change-this-refresh-secret-in-production
PORT=5000
NODE_ENV=production
BACKUP_RETENTION_DAYS=30
BACKUP_DIR=./backups
EOF
        print_warn "Edit $BACKEND_DIR/.env with your database credentials before starting."
    fi

    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        print_step "Creating frontend .env file..."
        cat > "$FRONTEND_DIR/.env" << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_STORAGE_KEY=token
EOF
    fi

    # Create database
    print_step "Creating PostgreSQL database..."
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw crime_intelligence; then
        print_info "Database 'crime_intelligence' already exists – skipping creation."
    else
        createdb -U postgres crime_intelligence && print_ok "Database created."
    fi

    # Apply schema
    print_step "Applying database schema..."
    psql -U postgres -d crime_intelligence -f "$APP_DIR/database/schema.sql" && print_ok "Schema applied."

    # Create backups directory
    mkdir -p "$BACKEND_DIR/backups"

    print_step "Installing PM2 process manager..."
    npm install -g pm2 2>/dev/null || print_warn "Could not install pm2 globally. Start with: cd backend && npm start"

    echo ""
    print_ok "Installation complete!"
    echo ""
    echo "  To start the application:"
    echo "    bash install.sh start"
    echo "  Or manually:"
    echo "    cd backend && npm start"
}

# ── UNINSTALL ─────────────────────────────────────────────────────────────────
uninstall() {
    print_step "Uninstalling Crime Intelligence Platform..."
    rm -rf "$BACKEND_DIR/node_modules"
    rm -rf "$FRONTEND_DIR/node_modules"
    rm -rf "$FRONTEND_DIR/build"
    print_ok "Uninstallation complete. Database and .env files were NOT removed."
}

# ── REINSTALL ─────────────────────────────────────────────────────────────────
reinstall() {
    uninstall
    install
}

# ── START ─────────────────────────────────────────────────────────────────────
start() {
    print_step "Starting Crime Intelligence Platform..."
    if command -v pm2 >/dev/null 2>&1 && [ -f "$APP_DIR/ecosystem.config.js" ]; then
        pm2 start "$APP_DIR/ecosystem.config.js"
    else
        cd "$BACKEND_DIR" && npm start
    fi
}

# ── STOP ──────────────────────────────────────────────────────────────────────
stop() {
    print_step "Stopping Crime Intelligence Platform..."
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop all 2>/dev/null || print_info "No PM2 processes to stop."
    fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
case "$1" in
    setup)     setup ;;
    install)   install ;;
    uninstall) uninstall ;;
    reinstall) reinstall ;;
    start)     start ;;
    stop)      stop ;;
    *)
        echo ""
        echo "Usage: $0 {setup|install|uninstall|reinstall|start|stop}"
        echo ""
        echo "  setup     – Full automated setup: installs all required software,"
        echo "              configures the database, creates the default admin user,"
        echo "              starts the application, and prints the login credentials."
        echo "              No manual steps required."
        echo ""
        echo "  install   – Install app dependencies only (prerequisites must be present)."
        echo "  uninstall – Remove installed dependencies."
        echo "  reinstall – Uninstall then install."
        echo "  start     – Start the application."
        echo "  stop      – Stop the application."
        echo ""
        exit 1
esac
