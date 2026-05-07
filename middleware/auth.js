const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  try {
    const user = await User.findById(req.session.user._id);
    if (!user || user.isBanned) {
      req.session.destroy();
      return res.redirect('/auth/login?error=Account+not+found+or+banned');
    }
    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    req.session.destroy();
    res.redirect('/auth/login');
  }
};

const requireAdmin = async (req, res, next) => {
  if (!req.session.user) return res.redirect('/auth/login');
  try {
    const user = await User.findById(req.session.user._id);
    if (!user || !user.isAdmin) {
      return res.status(403).render('error', { title: 'Forbidden', error: 'Admin access required.' });
    }
    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    res.redirect('/auth/login');
  }
};

const redirectIfAuth = (req, res, next) => {
  if (req.session.user) return res.redirect('/dashboard');
  next();
};

module.exports = { requireAuth, requireAdmin, redirectIfAuth };
