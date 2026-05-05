// ============================================================
// Shortie — Link Monetization Platform
// app.js — Main entry point
// ============================================================

require('dotenv').config();
const express    = require('express');
const session    = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose   = require('mongoose');
const path       = require('path');

const authRoutes = require('./routes/auth');
const linkRoutes = require('./routes/link');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Database ─────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

// ── View Engine ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static Files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ───────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// ── Global template locals ────────────────────────────────────
app.use((req, res, next) => {
  res.locals.userId    = req.session.userId || null;
  res.locals.userEmail = req.session.userEmail || null;
  res.locals.error     = null;
  res.locals.success   = null;
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', linkRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: '404 — Not Found' });
});

// ── Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('404', { title: 'Server Error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Shortie running at http://localhost:${PORT}`);
});
