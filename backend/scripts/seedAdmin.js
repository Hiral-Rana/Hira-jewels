const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'studio.hirajewels@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@hirajewels';

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

  if (existingAdmin) {
    existingAdmin.name = existingAdmin.name || 'Admin';
    existingAdmin.password = hashedPassword;
    existingAdmin.role = 'ADMIN';
    await existingAdmin.save();
    console.log(`Updated admin user: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
    });
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }
}

main()
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });