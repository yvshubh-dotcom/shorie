const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { clickLimiter } = require('../middleware/rateLimiter');

const BOT_PATTERNS = /bot|crawl|spider|slurp|mediapartners|adsbot|facebook|twitter|whatsapp|telegram|discord|slack|pinterest|linkedin|google|bing|baidu|yandex/i;

// GET /r/:code - Step 1 (timer page)
router.get('/:code', clickLimiter, async (req, res) => {
  const { code } = req.params;

  try {
    const link = await Link.findOne({ shortCode: code, isActive: true });
    if (!link) {
      return res.status(404).render('404', { title: 'Link Not Found' });
    }

    const userAgent = req.headers['user-agent'] || '';
    const isBot = BOT_PATTERNS.test(userAgent);

    res.render('redirect/step1', {
      title: 'Please Wait – Shortie',
      shortCode: code,
      isBot,
      link: { title: link.title || 'Shortie Link' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Error', error: 'Something went wrong.' });
  }
});

// POST /r/:code/continue - Step 2
router.post('/:code/continue', clickLimiter, async (req, res) => {
  const { code } = req.params;

  try {
    const link = await Link.findOne({ shortCode: code, isActive: true });
    if (!link) return res.status(404).render('404', { title: 'Link Not Found' });

    const userAgent = req.headers['user-agent'] || '';
    const isBot = BOT_PATTERNS.test(userAgent);

    if (!isBot) {
      const cpmRate = await Settings.get('cpmRate', 2.0);
      const earning = cpmRate / 1000;

      // Get user-specific CPM if set
      const user = await User.findById(link.userId);
      const userCpm = user && user.cpmRate !== null ? user.cpmRate : cpmRate;
      const userEarning = userCpm / 1000;

      await Link.findByIdAndUpdate(link._id, {
        $inc: { clicks: 1, earnings: userEarning },
      });

      await User.findByIdAndUpdate(link.userId, {
        $inc: { totalClicks: 1, totalEarnings: userEarning, balance: userEarning },
      });
    }

    res.render('redirect/step2', {
      title: 'Almost There – Shortie',
      shortCode: code,
      originalUrl: link.originalUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Error', error: 'Something went wrong.' });
  }
});

// GET /r/:code/go - Final redirect
router.get('/:code/go', async (req, res) => {
  try {
    const link = await Link.findOne({ shortCode: req.params.code, isActive: true });
    if (!link) return res.redirect('/');
    res.redirect(link.originalUrl);
  } catch (err) {
    res.redirect('/');
  }
});

module.exports = router;
