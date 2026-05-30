const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Load .env when present (local dev). In production, provide env vars via host.
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('ERROR: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

const adminEmail = process.env.ADMIN_EMAIL || 'studio.hirajewels@gmail.com';
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) {
  console.error('ERROR: ADMIN_PASSWORD environment variable is not set.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(async () => {
    let user = await User.findOne({ email: adminEmail });

    if (!user) {
      user = new User({ email: adminEmail });
    }

    const hash = await bcrypt.hash(adminPassword, 10);
    user.role = 'ADMIN';
    user.password = hash;
    await user.save();

    console.log('User updated!');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
