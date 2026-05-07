const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Settings = require('../models/Settings');

// GET /earnings
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const withdrawals = await Withdrawal.find({ userId: user._id }).sort({ createdAt: -1 });
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + w.amount, 0);
    const pendingAmount = withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);
    const cpmRate = await Settings.get('cpmRate', 2.0);
    const minWithdraw = await Settings.get('minWithdraw', 5.0);

    res.render('dashboard/earnings', {
      title: 'Earnings – Shortie',
      user,
      withdrawals,
      totalWithdrawn,
      pendingAmount,
      cpmRate,
      minWithdraw,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    res.render('error', { title: 'Error', error: 'Failed to load earnings.' });
  }
});

// GET /earnings/withdraw
router.get('/withdraw', requireAuth, async (req, res) => {
  const minWithdraw = await Settings.get('minWithdraw', 5.0);
  res.render('dashboard/withdraw', {
    title: 'Withdraw – Shortie',
    user: req.user,
    minWithdraw,
    error: req.query.error || null,
    success: req.query.success || null,
  });
});

// POST /earnings/withdraw
router.post('/withdraw', requireAuth, async (req, res) => {
  const { amount, paymentMethod, paymentDetails } = req.body;
  const user = req.user;
  const minWithdraw = await Settings.get('minWithdraw', 5.0);

  if (!amount || !paymentMethod || !paymentDetails) {
    return res.redirect('/earnings/withdraw?error=All+fields+required');
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum < minWithdraw) {
    return res.redirect(`/earnings/withdraw?error=Minimum+withdrawal+is+$${minWithdraw}`);
  }

  if (amountNum > user.balance) {
    return res.redirect('/earnings/withdraw?error=Insufficient+balance');
  }

  // Check for pending withdrawal
  const pendingExists = await Withdrawal.findOne({ userId: user._id, status: 'pending' });
  if (pendingExists) {
    return res.redirect('/earnings/withdraw?error=You+already+have+a+pending+withdrawal');
  }

  try {
    await Withdrawal.create({
      userId: user._id,
      amount: amountNum,
      paymentMethod,
      paymentDetails,
    });

    // Deduct from balance
    await User.findByIdAndUpdate(user._id, { $inc: { balance: -amountNum } });

    res.redirect('/earnings?success=Withdrawal+request+submitted');
  } catch (err) {
    console.error(err);
    res.redirect('/earnings/withdraw?error=Withdrawal+failed');
  }
});

module.exports = router;
