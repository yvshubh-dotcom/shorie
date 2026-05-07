const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { redirectIfAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// GET /auth/login
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('auth/login', {
    title: 'Login – Shortie',
    error: req.query.error || null,
    redirect: req.query.redirect || '/dashboard',
  });
});

// POST /auth/login
router.post('/login', authLimiter, redirectIfAuth, async (req, res) => {
  const { email, password, redirect } = req.body;
  const redirectTo = redirect || '/dashboard';

  if (!email || !password) {
    return res.render('auth/login', {
      title: 'Login – Shortie',
      error: 'Email and password are required.',
      redirect: redirectTo,
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.render('auth/login', {
        title: 'Login – Shortie',
        error: 'Invalid email or password.',
        redirect: redirectTo,
      });
    }

    if (user.isBanned) {
      return res.render('auth/login', {
        title: 'Login – Shortie',
        error: 'Your account has been suspended.',
        redirect: redirectTo,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', {
        title: 'Login – Shortie',
        error: 'Invalid email or password.',
        redirect: redirectTo,
      });
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    req.session.save((err) => {
      if (err) {
        return res.render('auth/login', {
          title: 'Login – Shortie',
          error: 'Session error. Please try again.',
          redirect: redirectTo,
        });
      }
      res.redirect(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
    });
  } catch (err) {
    console.error(err);
    res.render('auth/login', {
      title: 'Login – Shortie',
      error: 'Something went wrong. Please try again.',
      redirect: redirectTo,
    });
  }
});

// GET /auth/signup
router.get('/signup', redirectIfAuth, (req, res) => {
  res.render('auth/signup', {
    title: 'Sign Up – Shortie',
    error: null,
  });
});

// POST /auth/signup
router.post('/signup', authLimiter, redirectIfAuth, async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.render('auth/signup', { title: 'Sign Up – Shortie', error: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.render('auth/signup', { title: 'Sign Up – Shortie', error: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.render('auth/signup', { title: 'Sign Up – Shortie', error: 'Password must be at least 6 characters.' });
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return res.render('auth/signup', {
      title: 'Sign Up – Shortie',
      error: 'Username must be 3–30 characters, letters, numbers, underscores only.',
    });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase().trim() ? 'Email' : 'Username';
      return res.render('auth/signup', {
        title: 'Sign Up – Shortie',
        error: `${field} already in use.`,
      });
    }

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    req.session.save((err) => {
      if (err) return res.redirect('/auth/login');
      res.redirect('/dashboard');
    });
  } catch (err) {
    console.error(err);
    res.render('auth/signup', {
      title: 'Sign Up – Shortie',
      error: 'Something went wrong. Please try again.',
    });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
