# 🚀 CV-Craft Quick Start

## Your Servers Are Running! ✅

**Backend:** http://localhost:3001
**Frontend:** http://localhost:3000

---

## Essential Commands

| Action | Command |
|--------|---------|
| **Start servers** | `./start-dev.sh` |
| **Stop servers** | `./stop-dev.sh` or `Ctrl+C` |
| **View logs** | `./view-logs.sh` |
| **Open app** | `open http://localhost:3000` |

---

## What's New? 🎉

### 1. Accurate PDF Page Breaks
PDF preview now uses **actual measurements** instead of estimates.

### 2. Overflow Warnings
Yellow warning box appears when content is too large for PDF pages.

### 3. Real PDF Export
"Export PDF" button now generates actual PDFs using Puppeteer that match the preview exactly.

### 4. Safe Startup Scripts
No more port conflicts or orphaned processes!

---

## Test the New Features

1. Open http://localhost:3000
2. Create or edit a CV
3. Click **"PDF"** button (top right)
4. Look for **yellow warnings** if content overflows
5. Click **"Export → PDF"** to generate PDF
6. Compare exported PDF with preview

---

## Troubleshooting

**Servers won't start?**
```bash
./stop-dev.sh
./start-dev.sh
```

**Need to see what's happening?**
```bash
./view-logs.sh
```

**Port conflict?**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
./start-dev.sh
```

---

## File Locations

- **Exported PDFs:** `backend/exports/`
- **Database:** `backend/cv-craft.db`
- **Server Logs:** `backend.log`, `frontend.log`

---

## Documentation

- **Startup Scripts:** See `DEV-SCRIPTS-README.md`
- **Implementation:** See `STARTUP-SUMMARY.md`

---

**Happy Coding! 🎨📄**
