#!/bin/bash

# CV-Craft Development Server Stop Script

echo "🛑 Stopping CV-Craft Development Servers..."

# Kill backend (port 3001)
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "  Stopping backend (port 3001)..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    echo "  ✅ Backend stopped"
else
    echo "  ℹ️  Backend not running"
fi

# Kill frontend (port 3000)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "  Stopping frontend (port 3000)..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    echo "  ✅ Frontend stopped"
else
    echo "  ℹ️  Frontend not running"
fi

echo "✅ All servers stopped"
