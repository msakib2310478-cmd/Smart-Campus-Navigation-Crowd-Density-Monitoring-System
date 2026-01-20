#!/bin/bash
set -e

echo "🚀 Starting post-create setup for Smart Campus Navigation System..."
echo "=================================================="

# Get the workspace folder
WORKSPACE_DIR="/workspaces/Smart-Campus-Navigation-Crowd-Density-Monitoring-System"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# ============================================
# Backend Setup (Java/Spring Boot)
# ============================================
print_step "Setting up Backend (Java/Spring Boot)..."

cd "$WORKSPACE_DIR/backend"

# Verify Java installation
echo "Java version:"
java -version 2>&1 | head -n 1

# Verify Maven installation
echo "Maven version:"
mvn -version 2>&1 | head -n 1

# Download Maven dependencies (without building)
print_step "Downloading Maven dependencies..."
mvn dependency:go-offline -DskipTests -q || {
    print_warning "Some dependencies may have failed to download. Will retry on first build."
}

# Compile the project to verify setup
print_step "Compiling backend project..."
mvn compile -DskipTests -q && print_success "Backend compiled successfully!" || {
    print_warning "Backend compilation had issues. Please check pom.xml."
}

# ============================================
# Frontend Setup (Node.js/React/Vite)
# ============================================
print_step "Setting up Frontend (Node.js/React/Vite)..."

cd "$WORKSPACE_DIR/frontend"

# Verify Node.js installation
echo "Node.js version:"
node --version

# Verify npm installation
echo "npm version:"
npm --version

# Install npm dependencies
print_step "Installing npm dependencies..."
npm install && print_success "Frontend dependencies installed successfully!" || {
    print_warning "npm install had issues. Please run 'npm install' manually."
}

# ============================================
# Git Configuration
# ============================================
print_step "Configuring Git..."

# Set up git to handle line endings correctly
git config --global core.autocrlf input

# Enable git colors
git config --global color.ui auto

# ============================================
# Create helpful scripts
# ============================================
print_step "Creating helper scripts..."

# Create a script to start both frontend and backend
cat > "$WORKSPACE_DIR/start-all.sh" << 'EOF'
#!/bin/bash
echo "Starting Smart Campus Navigation System..."
echo "==========================================="

# Start backend in background
echo "Starting backend server on port 8080..."
cd /workspaces/Smart-Campus-Navigation-Crowd-Density-Monitoring-System/backend
mvn spring-boot:run &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 10

# Start frontend
echo "Starting frontend dev server on port 5173..."
cd /workspaces/Smart-Campus-Navigation-Crowd-Density-Monitoring-System/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting!"
echo "   Backend API: http://localhost:8080"
echo "   Frontend:    http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user interrupt
wait
EOF
chmod +x "$WORKSPACE_DIR/start-all.sh"

# Create a script to run only backend
cat > "$WORKSPACE_DIR/start-backend.sh" << 'EOF'
#!/bin/bash
echo "Starting Backend Server..."
cd /workspaces/Smart-Campus-Navigation-Crowd-Density-Monitoring-System/backend
mvn spring-boot:run
EOF
chmod +x "$WORKSPACE_DIR/start-backend.sh"

# Create a script to run only frontend
cat > "$WORKSPACE_DIR/start-frontend.sh" << 'EOF'
#!/bin/bash
echo "Starting Frontend Dev Server..."
cd /workspaces/Smart-Campus-Navigation-Crowd-Density-Monitoring-System/frontend
npm run dev
EOF
chmod +x "$WORKSPACE_DIR/start-frontend.sh"

print_success "Helper scripts created!"

# ============================================
# Final Summary
# ============================================
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Development environment setup complete!${NC}"
echo "=================================================="
echo ""
echo "📋 Quick Start Commands:"
echo "   • Start both servers:  ./start-all.sh"
echo "   • Start backend only:  ./start-backend.sh (or: cd backend && mvn spring-boot:run)"
echo "   • Start frontend only: ./start-frontend.sh (or: cd frontend && npm run dev)"
echo ""
echo "🌐 Default Ports:"
echo "   • Backend API:  http://localhost:8080"
echo "   • Frontend:     http://localhost:5173"
echo ""
echo "📚 Installed:"
echo "   • Java $(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')"
echo "   • Maven $(mvn -version 2>&1 | head -n 1 | awk '{print $3}')"
echo "   • Node.js $(node --version)"
echo "   • npm $(npm --version)"
echo ""
echo "Happy coding! 🚀"
