const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Link = require('../models/Link');
const Withdrawal = require('../models/Withdrawal');
const Settings = require('../models/Settings');

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const links = await Link.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5);
    const totalLinks = await Link.countDocuments({ userId: user._id });
    const withdrawals = await Withdrawal.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5);
    const pendingWithdrawals = await Withdrawal.countDocuments({ userId: user._id, status: 'pending' });
    const cpmRate = await Settings.get('cpmRate', 2.0);

    res.render('dashboard/index', {
      title: 'Dashboard – Shortie',
      user,
      links,
      totalLinks,
      withdrawals,
      pendingWithdrawals,
      cpmRate,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', error: 'Failed to load dashboard.' });
  }
});

// Settings page
router.get('/settings', requireAuth, async (req, res) => {
  res.render('dashboard/settings', {
    title: 'Settings – Shortie',
    user: req.user,
    success: req.query.success || null,
    error: req.query.error || null,
  });
});

router.post('/settings', requireAuth, async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const user = req.user;

  try {
    if (username && username !== user.username) {
      const exists = await require('../models/User').findOne({ username });
      if (exists) return res.redirect('/dashboard/settings?error=Username+already+taken');
      user.username = username;
    }

    if (newPassword) {
      if (!currentPassword) return res.redirect('/dashboard/settings?error=Current+password+required');
      const valid = await user.comparePassword(currentPassword);
      if (!valid) return res.redirect('/dashboard/settings?error=Current+password+incorrect');
      if (newPassword.length < 6) return res.redirect('/dashboard/settings?error=New+password+too+short');
      user.password = newPassword;
    }

    await user.save();
    req.session.user = { _id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin };
    res.redirect('/dashboard/settings?success=Settings+updated');
  } catch (err) {
    res.redirect('/dashboard/settings?error=Update+failed');
  }
});

module.exports = router;
