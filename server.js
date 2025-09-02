const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // lowdb setup

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 👉 Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// API: get all floors
app.get('/floors', (req, res) => {
  res.json(db.get('floors').value());
});

// API: add a new floor
app.post('/floors', (req, res) => {
  const floor = req.body;
  db.get('floors').push(floor).write();
  res.json({ message: 'Floor added', floor });
});

// API: get all meetings
app.get('/meetings', (req, res) => {
  res.json(db.get('meetings').value());
});

// API: add a new meeting
app.post('/meetings', (req, res) => {
  const meeting = req.body;
  db.get('meetings').push(meeting).write();
  res.json({ message: 'Meeting added', meeting });
});
// Route: suggest rooms based on participants
app.post('/suggestRooms', (req, res) => {
  const { participants } = req.body;

  // Get all rooms
  const rooms = db.get('floors').filter({ type: 'room' }).value();

  // Example logic: pick rooms that can fit the participants (assume room.capacity exists)
  const suitableRooms = rooms.filter(room => room.capacity >= participants);

  if (suitableRooms.length === 0) {
    return res.json({ message: "No suitable rooms found", rooms: [] });
  }

  res.json({ message: "Suitable rooms found", rooms: suitableRooms });
});
    
// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT}/ in your browser`);
});
