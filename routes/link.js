// routes/link.js — Link creation, step flow, redirect, dashboard

const express = require('express');
const { nanoid } = require('nanoid');
const Link    = require('../models/Link');

const router = express.Router();

// ── Middleware: require login ─────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login');
  next();
}

// ── Helper: validate URL ──────────────────────────────────────
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// ── GET / — Landing page ──────────────────────────────────────
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Shortie — Shorten. Share. Earn.',
    error: null,
    shortUrl: null
  });
});

// ── POST /api/create — Create short link ──────────────────────
router.post('/api/create', async (req, res) => {
  const { url } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Please enter a valid URL (must start with http:// or https://)' });
  }

  try {
    // Generate unique slug (6–8 chars)
    let slug, exists;
    do {
      slug  = nanoid(7); // 7-char unique ID
      exists = await Link.findOne({ slug });
    } while (exists);

    const link = await Link.create({
      original_url: url,
      slug,
      user_id: req.session.userId || null
    });

    const shortUrl = `${req.protocol}://${req.get('host')}/l/${slug}`;
    res.json({ success: true, shortUrl, slug });
  } catch (err) {
    console.error('Create link error:', err);
    res.status(500).json({ error: 'Failed to create link. Please try again.' });
  }
});

// ── GET /l/:slug — Step 1 entry point ────────────────────────
router.get('/l/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const link = await Link.findOne({ slug });
    if (!link) {
      return res.status(404).render('404', { title: 'Link Not Found' });
    }

    // Reset step flow for this visit
    req.session.slug  = slug;
    req.session.step1 = false;
    req.session.step2 = false;
    req.session.step3 = false;

    res.render('steps/step1', {
      title: 'Almost there... — Shortie',
      slug
    });
  } catch (err) {
    console.error('Step1 error:', err);
    res.redirect('/');
  }
});

// ── POST /l/:slug/step1 — Complete step 1 ────────────────────
router.post('/l/:slug/step1', (req, res) => {
  const { slug } = req.params;

  // Ensure this slug matches the active session
  if (req.session.slug !== slug) {
    return res.redirect(`/l/${slug}`);
  }

  req.session.step1 = true;
  res.redirect(`/l/${slug}/step2`);
});

// ── GET /l/:slug/step2 ────────────────────────────────────────
router.get('/l/:slug/step2', (req, res) => {
  const { slug } = req.params;

  // Anti-skip: must have completed step1
  if (req.session.slug !== slug || !req.session.step1) {
    return res.redirect(`/l/${slug}`);
  }

  res.render('steps/step2', {
    title: 'One more step... — Shortie',
    slug
  });
});

// ── POST /l/:slug/step2 ───────────────────────────────────────
router.post('/l/:slug/step2', (req, res) => {
  const { slug } = req.params;

  if (req.session.slug !== slug || !req.session.step1) {
    return res.redirect(`/l/${slug}`);
  }

  req.session.step2 = true;
  res.redirect(`/l/${slug}/step3`);
});

// ── GET /l/:slug/step3 ────────────────────────────────────────
router.get('/l/:slug/step3', (req, res) => {
  const { slug } = req.params;

  // Anti-skip: must have completed step1 + step2
  if (req.session.slug !== slug || !req.session.step1 || !req.session.step2) {
    return res.redirect(`/l/${slug}`);
  }

  res.render('steps/step3', {
    title: 'Final step — Shortie',
    slug
  });
});

// ── POST /l/:slug/step3 — Final verify + redirect ─────────────
router.post('/l/:slug/step3', async (req, res) => {
  const { slug } = req.params;

  // Anti-skip: verify all steps completed
  if (
    req.session.slug  !== slug  ||
    !req.session.step1 ||
    !req.session.step2
  ) {
    return res.redirect(`/l/${slug}`);
  }

  req.session.step3 = true;

  try {
    // Increment click count
    const link = await Link.findOneAndUpdate(
      { slug },
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!link) return res.redirect('/');

    // Clear step session data
    req.session.slug  = null;
    req.session.step1 = false;
    req.session.step2 = false;
    req.session.step3 = false;

    // Redirect to original URL
    res.redirect(link.original_url);
  } catch (err) {
    console.error('Final redirect error:', err);
    res.redirect('/');
  }
});

// ── GET /dashboard — User dashboard ──────────────────────────
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const links = await Link.find({ user_id: req.session.userId })
      .sort({ created_at: -1 })
      .lean();

    const totalLinks  = links.length;
    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);

    res.render('dashboard', {
      title: 'Dashboard — Shortie',
      links,
      totalLinks,
      totalClicks,
      host: req.get('host'),
      protocol: req.protocol,
      error: null
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('dashboard', {
      title: 'Dashboard — Shortie',
      links: [],
      totalLinks: 0,
      totalClicks: 0,
      host: req.get('host'),
      protocol: req.protocol,
      error: 'Failed to load links.'
    });
  }
});

module.exports = router;
