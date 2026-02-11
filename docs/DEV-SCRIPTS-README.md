# CV-Craft Development Scripts

> **Note:** These are legacy shell scripts from before the pnpm workspace setup. The recommended way to start development is `pnpm dev` from the project root. These scripts still work but reference the older process management approach.

## Quick Start

### Starting the Development Servers

```bash
./start-dev.sh
```

This script will:
1. Check and kill any processes on ports 4200 and 4201
2. Verify dependencies are installed
3. Start backend on port 4201
4. Start frontend on port 4200
5. Monitor both servers and restart on crash
6. Provide clear status messages

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
- Missing dependencies: `cd backend && pnpm install`
- Database issues: Check `backend/cv-craft.db` exists

### Frontend Won't Start

Check the frontend log:
```bash
tail -n 50 frontend.log
```

Common issues:
- Port 4200 still in use
- Missing dependencies: `cd frontend && pnpm install`
- Build errors in TypeScript

### Manual Port Cleanup

If the stop script doesn't work:
```bash
# Kill backend
lsof -ti:4201 | xargs kill -9

# Kill frontend
lsof -ti:4200 | xargs kill -9
```

## Manual Startup (Alternative)

If you prefer to run servers manually:

**Terminal 1 (Backend):**
```bash
cd backend
pnpm dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
pnpm dev
```

## Environment

**Default Ports:**
- Backend: 4201
- Frontend: 4200

**Database:**
- Location: `backend/cv-craft.db`
- Type: SQLite

**Node Version:**
- Minimum: Node 18+
- Recommended: Node 20+
