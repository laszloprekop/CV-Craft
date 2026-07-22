#!/bin/bash

# CV-Craft Development Server Stop Script

echo "🛑 Stopping CV-Craft Development Servers..."

# Kill backend (port 4301)
if lsof -ti:4301 > /dev/null 2>&1; then
    echo "  Stopping backend (port 4301)..."
    lsof -ti:4301 | xargs kill -9 2>/dev/null || true
    echo "  ✅ Backend stopped"
else
    echo "  ℹ️  Backend not running"
fi

# Kill frontend (port 4300)
if lsof -ti:4300 > /dev/null 2>&1; then
    echo "  Stopping frontend (port 4300)..."
    lsof -ti:4300 | xargs kill -9 2>/dev/null || true
    echo "  ✅ Frontend stopped"
else
    echo "  ℹ️  Frontend not running"
fi

echo "✅ All servers stopped"
