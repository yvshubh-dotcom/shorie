require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];
if (!email) { console.error('Usage: node scripts/make-admin.js <email>'); process.exit(1); }

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shortie')
  .then(async () => {
    const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { isAdmin: true }, { new: true });
    if (!user) { console.error('User not found:', email); process.exit(1); }
    console.log(`✅ ${user.username} (${user.email}) is now an admin.`);
    process.exit(0);
  })
  .catch(err => { console.error(err); process.exit(1); });
