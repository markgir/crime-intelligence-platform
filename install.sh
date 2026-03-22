#!/bin/bash

# Install, uninstall, and reinstall script for the Crime Intelligence Platform

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

print_step() { echo ""; echo ">>> $1"; }

# Function to install the application
install() {
    print_step "Installing Crime Intelligence Platform..."

    # Check prerequisites
    command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Please install Node.js v14+."; exit 1; }
    command -v npm >/dev/null 2>&1 || { echo "❌ npm is required."; exit 1; }
    command -v psql >/dev/null 2>&1 || { echo "❌ PostgreSQL client (psql) is required."; exit 1; }

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
        echo "⚠️  Please edit $BACKEND_DIR/.env with your database credentials."
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
        echo "Database 'crime_intelligence' already exists, skipping creation."
    else
        createdb -U postgres crime_intelligence && echo "✅ Database created."
    fi

    # Apply schema
    print_step "Applying database schema..."
    psql -U postgres -d crime_intelligence -f "$APP_DIR/database/schema.sql" && echo "✅ Schema applied."

    # Create backups directory
    mkdir -p "$BACKEND_DIR/backups"

    print_step "Installing PM2 process manager..."
    npm install -g pm2 2>/dev/null || echo "⚠️  Could not install pm2 globally. You can start the server with: cd backend && npm start"

    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "To start the application:"
    echo "  cd backend && npm start"
    echo "  (or: pm2 start ecosystem.config.js)"
}

# Function to uninstall the application
uninstall() {
    print_step "Uninstalling Crime Intelligence Platform..."
    rm -rf "$BACKEND_DIR/node_modules"
    rm -rf "$FRONTEND_DIR/node_modules"
    rm -rf "$FRONTEND_DIR/build"
    echo "✅ Uninstallation complete. Database and .env files were NOT removed."
}

# Function to reinstall the application
reinstall() {
    uninstall
    install
}

# Function to start the application
start() {
    print_step "Starting Crime Intelligence Platform..."
    if command -v pm2 >/dev/null 2>&1 && [ -f "$APP_DIR/ecosystem.config.js" ]; then
        pm2 start "$APP_DIR/ecosystem.config.js"
    else
        cd "$BACKEND_DIR" && npm start
    fi
}

# Function to stop the application
stop() {
    print_step "Stopping Crime Intelligence Platform..."
    if command -v pm2 >/dev/null 2>&1; then
        pm2 stop all 2>/dev/null || echo "No PM2 processes to stop."
    fi
}

# Main script execution
case "$1" in
    install)   install ;;
    uninstall) uninstall ;;
    reinstall) reinstall ;;
    start)     start ;;
    stop)      stop ;;
    *)
        echo "Usage: $0 {install|uninstall|reinstall|start|stop}"
        exit 1
esac
