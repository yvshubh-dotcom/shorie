const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Link = require('../models/Link');
const Withdrawal = require('../models/Withdrawal');
const Settings = require('../models/Settings');

router.get('/', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLinks = await Link.countDocuments();
    const totalClicks = await Link.aggregate([{ $group: { _id: null, total: { $sum: '$clicks' } } }]);
    const totalEarningsPaid = await Withdrawal.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const cpmRate = await Settings.get('cpmRate', 2.0);
    const minWithdraw = await Settings.get('minWithdraw', 5.0);

    res.render('admin/index', {
      title: 'Admin Panel – Shortie',
      user: req.user,
      stats: {
        totalUsers,
        totalLinks,
        totalClicks: totalClicks[0]?.total || 0,
        totalEarningsPaid: totalEarningsPaid[0]?.total || 0,
        pendingWithdrawals,
      },
      cpmRate,
      minWithdraw,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', error: 'Failed to load admin panel.' });
  }
});

// Users list
router.get('/users', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const search = req.query.search || '';

  const query = search ? { $or: [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};
  const total = await User.countDocuments(query);
  const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

  res.render('admin/users', {
    title: 'Users – Admin',
    user: req.user,
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    search,
  });
});

// Ban/unban user
router.post('/users/:id/ban', requireAdmin, async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) return res.redirect('/admin/users?error=User+not+found');
  if (target.isAdmin) return res.redirect('/admin/users?error=Cannot+ban+admin');
  target.isBanned = !target.isBanned;
  await target.save();
  res.redirect('/admin/users?success=User+status+updated');
});

// Links list
router.get('/links', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const total = await Link.countDocuments();
  const links = await Link.find().populate('userId', 'username email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

  res.render('admin/links', {
    title: 'Links – Admin',
    user: req.user,
    links,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// Withdrawals
router.get('/withdrawals', requireAdmin, async (req, res) => {
  const status = req.query.status || 'pending';
  const withdrawals = await Withdrawal.find({ status }).populate('userId', 'username email').sort({ createdAt: -1 });

  res.render('admin/withdrawals', {
    title: 'Withdrawals – Admin',
    user: req.user,
    withdrawals,
    status,
    success: req.query.success || null,
    error: req.query.error || null,
  });
});

// Approve withdrawal
router.post('/withdrawals/:id/approve', requireAdmin, async (req, res) => {
  const w = await Withdrawal.findById(req.params.id);
  if (!w) return res.redirect('/admin/withdrawals?error=Not+found');
  w.status = 'approved';
  w.processedAt = new Date();
  await w.save();
  res.redirect('/admin/withdrawals?success=Withdrawal+approved');
});

// Reject withdrawal
router.post('/withdrawals/:id/reject', requireAdmin, async (req, res) => {
  const w = await Withdrawal.findById(req.params.id);
  if (!w) return res.redirect('/admin/withdrawals?error=Not+found');

  // Refund balance
  await User.findByIdAndUpdate(w.userId, { $inc: { balance: w.amount } });

  w.status = 'rejected';
  w.processedAt = new Date();
  if (req.body.note) w.note = req.body.note;
  await w.save();
  res.redirect('/admin/withdrawals?success=Withdrawal+rejected+and+refunded');
});

// Update settings
router.post('/settings', requireAdmin, async (req, res) => {
  const { cpmRate, minWithdraw } = req.body;
  if (cpmRate) await Settings.set('cpmRate', parseFloat(cpmRate));
  if (minWithdraw) await Settings.set('minWithdraw', parseFloat(minWithdraw));
  res.redirect('/admin?success=Settings+updated');
});

// Update user CPM
router.post('/users/:id/cpm', requireAdmin, async (req, res) => {
  const { cpmRate } = req.body;
  await User.findByIdAndUpdate(req.params.id, { cpmRate: cpmRate ? parseFloat(cpmRate) : null });
  res.redirect('/admin/users?success=User+CPM+updated');
});

module.exports = router;
