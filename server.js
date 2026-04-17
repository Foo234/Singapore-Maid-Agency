const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Database
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});

// Create tables if they don't exist
db.serialize(() => {
  // Maids table
  db.run(`CREATE TABLE IF NOT EXISTS maids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    nationality TEXT NOT NULL,
    age INTEGER,
    experience INTEGER,
    languages TEXT,
    availability TEXT,
    hourly_rate REAL,
    photo_url TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maid_id INTEGER,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    service_date TEXT NOT NULL,
    hours INTEGER,
    service_type TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(maid_id) REFERENCES maids(id)
  )`);

  // Testimonials table
  db.run(`CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    rating INTEGER,
    comment TEXT,
    approved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// API Routes

// Get all maids
app.get('/api/maids', (req, res) => {
  db.all('SELECT * FROM maids ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single maid
app.get('/api/maids/:id', (req, res) => {
  db.get('SELECT * FROM maids WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// Add new maid (Admin)
app.post('/api/maids', (req, res) => {
  const { name, nationality, age, experience, languages, availability, hourly_rate, photo_url, bio } = req.body;
  db.run(
    'INSERT INTO maids (name, nationality, age, experience, languages, availability, hourly_rate, photo_url, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, nationality, age, experience, languages, availability, hourly_rate, photo_url, bio],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Maid added successfully' });
    }
  );
});

// Delete maid (Admin)
app.delete('/api/maids/:id', (req, res) => {
  db.run('DELETE FROM maids WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Maid deleted successfully' });
  });
});

// Create booking
app.post('/api/bookings', (req, res) => {
  const { maid_id, client_name, client_email, client_phone, service_date, hours, service_type, notes } = req.body;
  db.run(
    'INSERT INTO bookings (maid_id, client_name, client_email, client_phone, service_date, hours, service_type, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [maid_id, client_name, client_email, client_phone, service_date, hours, service_type, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Booking request submitted successfully' });
    }
  );
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
  db.all('SELECT * FROM bookings ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update booking status (Admin)
app.patch('/api/bookings/:id', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Booking updated successfully' });
  });
});

// Get approved testimonials
app.get('/api/testimonials', (req, res) => {
  db.all('SELECT * FROM testimonials WHERE approved = 1 ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Submit testimonial
app.post('/api/testimonials', (req, res) => {
  const { client_name, rating, comment } = req.body;
  db.run(
    'INSERT INTO testimonials (client_name, rating, comment) VALUES (?, ?, ?)',
    [client_name, rating, comment],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Thank you for your review!' });
    }
  );
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});