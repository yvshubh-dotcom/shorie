const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Link = require('../models/Link');
const { nanoid } = require('nanoid');

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// GET /links - My Links
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const total = await Link.countDocuments({ userId: req.user._id });
    const links = await Link.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render('dashboard/links', {
      title: 'My Links – Shortie',
      user: req.user,
      links,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', error: 'Failed to load links.' });
  }
});

// GET /links/create
router.get('/create', requireAuth, (req, res) => {
  res.render('dashboard/create-link', {
    title: 'Create Link – Shortie',
    user: req.user,
    error: null,
    success: null,
    newLink: null,
  });
});

// POST /links/create
router.post('/create', requireAuth, async (req, res) => {
  let { originalUrl, customCode, title } = req.body;

  if (!originalUrl) {
    return res.render('dashboard/create-link', {
      title: 'Create Link – Shortie',
      user: req.user,
      error: 'URL is required.',
      success: null,
      newLink: null,
    });
  }

  // Add https if missing
  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = 'https://' + originalUrl;
  }

  if (!isValidUrl(originalUrl)) {
    return res.render('dashboard/create-link', {
      title: 'Create Link – Shortie',
      user: req.user,
      error: 'Please enter a valid URL.',
      success: null,
      newLink: null,
    });
  }

  try {
    let shortCode = customCode ? customCode.trim().toLowerCase() : nanoid(7);
    shortCode = shortCode.replace(/[^a-zA-Z0-9_-]/g, '');

    if (shortCode.length < 3 || shortCode.length > 20) {
      return res.render('dashboard/create-link', {
        title: 'Create Link – Shortie',
        user: req.user,
        error: 'Custom code must be 3–20 characters.',
        success: null,
        newLink: null,
      });
    }

    const existing = await Link.findOne({ shortCode });
    if (existing) {
      return res.render('dashboard/create-link', {
        title: 'Create Link – Shortie',
        user: req.user,
        error: 'That custom code is already taken.',
        success: null,
        newLink: null,
      });
    }

    const link = await Link.create({
      originalUrl,
      shortCode,
      title: title || '',
      userId: req.user._id,
    });

    const shortUrl = `${req.protocol}://${req.get('host')}/r/${shortCode}`;

    res.render('dashboard/create-link', {
      title: 'Create Link – Shortie',
      user: req.user,
      error: null,
      success: 'Link created successfully!',
      newLink: { ...link.toObject(), shortUrl },
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard/create-link', {
      title: 'Create Link – Shortie',
      user: req.user,
      error: 'Failed to create link. Please try again.',
      success: null,
      newLink: null,
    });
  }
});

// POST /links/delete/:id
router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    await Link.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.redirect('/links?success=Link+deleted');
  } catch (err) {
    res.redirect('/links?error=Delete+failed');
  }
});

// GET /links/analytics/:id
router.get('/analytics/:id', requireAuth, async (req, res) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, userId: req.user._id });
    if (!link) return res.redirect('/links?error=Link+not+found');

    const shortUrl = `${req.protocol}://${req.get('host')}/r/${link.shortCode}`;

    res.render('dashboard/analytics', {
      title: 'Analytics – Shortie',
      user: req.user,
      link,
      shortUrl,
    });
  } catch (err) {
    res.redirect('/links');
  }
});

module.exports = router;
