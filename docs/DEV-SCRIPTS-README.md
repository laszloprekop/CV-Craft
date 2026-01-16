# CV-Craft Development Scripts

## Quick Start

### Starting the Development Servers

```bash
./start-dev.sh
```

This script will:
1. ✅ Check and kill any processes on ports 3000 and 3001
2. ✅ Verify dependencies are installed
3. ✅ Start backend on port 3001
4. ✅ Start frontend on port 3000
5. ✅ Monitor both servers and restart on crash
6. ✅ Provide clear status messages with colors

**What you'll see:**
```
🚀 CV-Craft Development Server Startup
======================================
✅ Backend:  http://localhost:3001
🌐 Frontend: http://localhost:3000

Press Ctrl+C to stop all servers
```

### Stopping the Servers

**Option 1: Graceful Shutdown (Recommended)**
```bash
# Press Ctrl+C in the terminal where start-dev.sh is running
```

**Option 2: Force Stop**
```bash
./stop-dev.sh
```

## Logs

The startup script creates log files in the project root:
- `backend.log` - Backend server logs
- `frontend.log` - Frontend server logs

**View logs in real-time:**
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log

# Both logs side-by-side
tail -f backend.log frontend.log
```

## Troubleshooting

### Port Already in Use

If you see errors about ports being in use:
```bash
./stop-dev.sh
./start-dev.sh
```

### Backend Won't Start

Check the backend log:
```bash
tail -n 50 backend.log
```

Common issues:
- TypeScript compilation errors
- Missing dependencies: `cd backend && npm install`
- Database issues: Check `backend/cv-craft.db` exists

### Frontend Won't Start

Check the frontend log:
```bash
tail -n 50 frontend.log
```

Common issues:
- Port 3000 still in use
- Missing dependencies: `cd frontend && npm install`
- Build errors in TypeScript

### Manual Port Cleanup

If the stop script doesn't work:
```bash
# Kill backend
lsof -ti:3001 | xargs kill -9

# Kill frontend
lsof -ti:3000 | xargs kill -9
```

## Manual Startup (Alternative)

If you prefer to run servers manually:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## Features

### Auto-Recovery
The startup script monitors both processes and will:
- Display crash information
- Show last 20 lines of logs
- Cleanly shut down all servers

### Color-Coded Output
- 🟢 Green: Success messages
- 🟡 Yellow: Information/warnings
- 🔴 Red: Errors

### Safety Checks
- Verifies you're in the correct directory
- Checks for existing processes before starting
- Waits for servers to actually start (not just launch)
- Validates port availability

## Environment

**Default Ports:**
- Backend: 3001
- Frontend: 3000

**Database:**
- Location: `backend/cv-craft.db`
- Type: SQLite

**Node Version:**
- Minimum: Node 18+
- Recommended: Node 20+

## PDF Generation Testing

Once servers are running, you can test the new PDF generation:

1. Open http://localhost:3000
2. Create or edit a CV
3. Click the "PDF Preview" button to see paginated view
4. Look for any yellow warning boxes about content overflow
5. Click "Export → PDF" to generate actual PDF
6. Check the generated PDF matches the preview

**Expected behavior:**
- PDF preview should show accurate page breaks
- Overflow warnings appear if content is too large
- Generated PDF should match preview exactly
- PDFs saved to `backend/exports/` directory
