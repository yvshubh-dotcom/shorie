// routes/auth.js — Login, Signup, Logout

const express = require('express');
const bcrypt  = require('bcrypt');
const User    = require('../models/User');

const router = express.Router();

// ── Middleware: redirect if already logged in ─────────────────
function redirectIfAuth(req, res, next) {
  if (req.session.userId) return res.redirect('/dashboard');
  next();
}

// ── GET /login ────────────────────────────────────────────────
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('login', { title: 'Login — Shortie', error: null });
});

// ── POST /login ───────────────────────────────────────────────
router.post('/login', redirectIfAuth, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.render('login', {
        title: 'Login — Shortie',
        error: 'Email and password are required.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.render('login', {
        title: 'Login — Shortie',
        error: 'Invalid email or password.'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        title: 'Login — Shortie',
        error: 'Invalid email or password.'
      });
    }

    // Set session
    req.session.userId    = user._id.toString();
    req.session.userEmail = user.email;

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', {
      title: 'Login — Shortie',
      error: 'Something went wrong. Please try again.'
    });
  }
});

// ── GET /signup ───────────────────────────────────────────────
router.get('/signup', redirectIfAuth, (req, res) => {
  res.render('signup', { title: 'Sign Up — Shortie', error: null });
});

// ── POST /signup ──────────────────────────────────────────────
router.post('/signup', redirectIfAuth, async (req, res) => {
  const { email, password, confirm_password } = req.body;

  try {
    // Validation
    if (!email || !password || !confirm_password) {
      return res.render('signup', {
        title: 'Sign Up — Shortie',
        error: 'All fields are required.'
      });
    }

    if (password.length < 6) {
      return res.render('signup', {
        title: 'Sign Up — Shortie',
        error: 'Password must be at least 6 characters.'
      });
    }

    if (password !== confirm_password) {
      return res.render('signup', {
        title: 'Sign Up — Shortie',
        error: 'Passwords do not match.'
      });
    }

    // Check if email already registered
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.render('signup', {
        title: 'Sign Up — Shortie',
        error: 'An account with this email already exists.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    // Auto-login after signup
    req.session.userId    = user._id.toString();
    req.session.userEmail = user.email;

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Signup error:', err);
    res.render('signup', {
      title: 'Sign Up — Shortie',
      error: 'Something went wrong. Please try again.'
    });
  }
});

// ── GET /logout ───────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout error:', err);
    res.redirect('/login');
  });
});

module.exports = router;
