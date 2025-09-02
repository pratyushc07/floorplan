
# Floorplan MVP (Simple)

This is a minimal, simple MVP implementation for the "Intelligent Floor Plan Management" case study. 
Purpose: a basic app to demonstrate uploading/modifying floor entities, offline ops queue, sync, conflict handling (naive), and meeting room suggestions.

## What is included
- `server.js` — Node.js + Express backend, file-backed DB using `lowdb`.
- `public/index.html` + `public/app.js` — simple front-end (no build tools). Frontend stores local ops in `localStorage` as a queue when offline and syncs when online.
- `db.json` — initial database file.

## How to run (locally)
1. Install Node.js (>=14).
2. In the project folder, run:
   ```bash
   npm install
   npm start
   ```
3. Open `http://localhost:4000` in your browser.

## Notes on features
- Offline: edits push ops to localStorage queue. When connection returns, click "Sync Now" or automatic sync runs every 8s.
- Conflict resolution on server: simple last-write-wins by timestamp; server returns a `conflicts` list for problematic ops.
- Room suggestions: `/api/rooms/suggest` uses a simple scoring formula (capacity fit + proximity + popularity).

This is intentionally simple to be easy to run and demo. You can extend it later.

