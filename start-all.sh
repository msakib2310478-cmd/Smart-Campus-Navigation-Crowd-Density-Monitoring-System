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
