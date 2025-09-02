
# Demo recording suggestions (short demo video, 2-4 minutes)

1. Start the server: `npm install && npm start`.
2. Open http://localhost:4000.
3. Show initial layout (rooms displayed).
4. Demonstrate offline edits:
   - Turn off network (or use browser DevTools -> Offline).
   - Add a seat and move it; show the op appearing in the Op Queue (localStorage).
   - Turn network back on and click "Sync Now". Show the server-applied changes (queue clears).
5. Demonstrate conflict (optional):
   - Open two browser windows. In one, create or move a seat but don't sync yet (put offline).
   - In other, move the same seat and sync.
   - Then sync the first window; the server will detect conflict and either apply or return conflict.
6. Demonstrate room suggestions:
   - Enter number of participants and click "Suggest Rooms". Show suggestion list and explain scoring briefly.
7. Mention limitations and possible improvements in voiceover.

Record with any screen capture tool (OBS Studio, Loom, etc.).

