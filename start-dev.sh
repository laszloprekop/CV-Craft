#!/bin/bash

# CV-Craft Development Server Startup Script
# Safely starts backend and frontend servers

set -e  # Exit on error

echo "🚀 CV-Craft Development Server Startup"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Must be run from CV-Craft root directory${NC}"
    exit 1
fi

# Function to kill processes on a port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)

    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}⚠️  Killing existing processes on port $port: $pids${NC}"
        kill -9 $pids 2>/dev/null || true
        sleep 1
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    echo -e "${YELLOW}⏳ Waiting for $name to start on port $port...${NC}"

    while [ $attempt -lt $max_attempts ]; do
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready on port $port${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done

    echo -e "${RED}❌ $name failed to start within 30 seconds${NC}"
    return 1
}

# Clean up function for graceful shutdown
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill_port 4201
    kill_port 4200
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup SIGINT SIGTERM

# Step 1: Kill any existing processes
echo -e "\n${YELLOW}Step 1: Checking for existing processes...${NC}"
kill_port 4201
kill_port 4200

# Step 2: Check node_modules
echo -e "\n${YELLOW}Step 2: Checking dependencies...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found, installing...${NC}"
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found, installing...${NC}"
    cd frontend && npm install && cd ..
fi

echo -e "${GREEN}✅ Dependencies checked${NC}"

# Step 3: Start Backend
echo -e "\n${YELLOW}Step 3: Starting Backend (port 4201)...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
if ! wait_for_server 4201 "Backend"; then
    echo -e "${RED}❌ Backend startup failed. Check backend.log for errors${NC}"
    tail -n 20 backend.log
    cleanup
fi

# Step 4: Start Frontend
echo -e "\n${YELLOW}Step 4: Starting Frontend (port 4200)...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
if ! wait_for_server 4200 "Frontend"; then
    echo -e "${RED}❌ Frontend startup failed. Check frontend.log for errors${NC}"
    tail -n 20 frontend.log
    cleanup
fi

# All done
echo -e "\n${GREEN}======================================"
echo -e "✅ CV-Craft is running!"
echo -e "======================================${NC}"
echo -e "${GREEN}📊 Backend:  http://localhost:4201${NC}"
echo -e "${GREEN}🌐 Frontend: http://localhost:4200${NC}"
echo -e "\n${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log"
echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Keep script running and monitor processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend crashed! Check backend.log${NC}"
        tail -n 20 backend.log
        cleanup
    fi

    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend crashed! Check frontend.log${NC}"
        tail -n 20 frontend.log
        cleanup
    fi

    sleep 5
done
