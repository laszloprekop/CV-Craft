#!/bin/bash

# CV-Craft Log Viewer

if [ "$1" == "backend" ]; then
    echo "📊 Viewing Backend Logs (Ctrl+C to exit)"
    echo "========================================"
    tail -f backend.log
elif [ "$1" == "frontend" ]; then
    echo "🌐 Viewing Frontend Logs (Ctrl+C to exit)"
    echo "========================================="
    tail -f frontend.log
elif [ "$1" == "both" ] || [ -z "$1" ]; then
    echo "📊🌐 Viewing Both Logs (Ctrl+C to exit)"
    echo "========================================"
    tail -f backend.log frontend.log
else
    echo "Usage: ./view-logs.sh [backend|frontend|both]"
    echo ""
    echo "Examples:"
    echo "  ./view-logs.sh           # View both logs"
    echo "  ./view-logs.sh backend   # View backend only"
    echo "  ./view-logs.sh frontend  # View frontend only"
    exit 1
fi
