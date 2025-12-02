require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const mpesa = require('./mpesa');

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = path.join(__dirname, 'db.json');
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// simple db read/write
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: {}, sessions: {}, payments: [] };
  }
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

app.use('/', express.static(FRONTEND_DIR));

// -- Auth / Login --
app.post('/api/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false, error: 'username required' });
  const db = readDB();
  if (!db.users[username]) {
    db.users[username] = { username, createdAt: Date.now() };
    writeDB(db);
  }
  res.json({ success: true, username });
});

// -- Pay & generate code --
app.post('/api/pay', async (req, res) => {
  const { username, packageId, phone } = req.body;
  const packages = {
    '1hr': { amount: 10, ms: 60*60*1000 },
    '2hr': { amount: 20, ms: 2*60*60*1000 },
    '5hr': { amount: 40, ms: 5*60*60*1000 }
  };
  if (!packages[packageId]) return res.status(400).json({ success: false, error: 'invalid package' });

  const pkg = packages[packageId];
  // phone fallback to env default
  const phoneNumber = phone || process.env.DEFAULT_PHONE;

  try {
    // Trigger STK push (will return immediate response from Safaricom)
    const resp = await mpesa.stkPush({
      phone: phoneNumber,
      amount: pkg.amount,
      shortcode: process.env.MPESA_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY,
      key: process.env.MPESA_CONSUMER_KEY,
      secret: process.env.MPESA_CONSUMER_SECRET,
      callback: process.env.MPESA_CALLBACK_URL,
      useSandbox: process.env.USE_SANDBOX
    });

    // Create access code and session (you may want to mark active after payment confirmation from callback)
    const code = uuid().slice(0,6).toUpperCase();
    const db = readDB();
    const expiry = Date.now() + pkg.ms;
    db.sessions[code] = { username, expiry, packageId, createdAt: Date.now() };
    db.payments.push({ username, code, amount: pkg.amount, phone: phoneNumber, createdAt: Date.now(), rawResponse: resp });
    writeDB(db);

    res.json({ success: true, code, expiry });
  } catch (err) {
    console.error('STK push error', err && err.response ? err.response.data : err);
    return res.status(500).json({ success: false, error: 'payment_request_failed', details: err && err.response ? err.response.data : String(err) });
  }
});

// -- Validate access code (for router) --
app.post('/api/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false, error: 'code required' });
  const db = readDB();
  const session = db.sessions[code];
  if (!session) return res.json({ valid: false, reason: 'not_found' });
  if (Date.now() > session.expiry) {
    // expired -> remove session
    delete db.sessions[code];
    writeDB(db);
    return res.json({ valid: false, reason: 'expired' });
  }
  return res.json({ valid: true, username: session.username, expiresAt: session.expiry });
});

// -- MPESA callback endpoint (basic) --
app.post('/mpesa/callback', (req, res) => {
  // Safaricom will POST payment/result here.
  // For demo we just log and persist.
  const db = readDB();
  db.payments.push({ callback: req.body, receivedAt: Date.now() });
  writeDB(db);
  // respond 200
  res.json({ success: true });
});

// -- simple cleanup route to remove expired sessions (can be called by cron/router) --
app.post('/api/cleanup', (req, res) => {
  const db = readDB();
  const now = Date.now();
  let removed = 0;
  Object.keys(db.sessions).forEach(code => {
    if (db.sessions[code].expiry <= now) {
      delete db.sessions[code];
      removed++;
    }
  });
  writeDB(db);
  res.json({ success: true, removed });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server listening on port', port));
