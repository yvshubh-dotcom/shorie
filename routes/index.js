const express = require('express');
const router = express.Router();
const { redirectIfAuth } = require('../middleware/auth');

router.get('/', redirectIfAuth, (req, res) => {
  res.render('index', { title: 'Shortie – Monetize Every Click' });
});

module.exports = router;
