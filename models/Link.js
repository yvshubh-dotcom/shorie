// models/Link.js — Mongoose schema for shortened links

const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 6,
    maxlength: 8
  },
  // Optional — null if created by anonymous user
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Total clicks (incremented only after full step flow)
  clicks: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index for fast slug lookups
linkSchema.index({ slug: 1 });
linkSchema.index({ user_id: 1 });

module.exports = mongoose.model('Link', linkSchema);
