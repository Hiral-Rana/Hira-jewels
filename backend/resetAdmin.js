const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect("mongodb+srv://studiohirajewels_db_user:Hirajewelsdb@hirajewels.ocwvm5y.mongodb.net/?appName=Hirajewels")
  .then(async () => {
    let user = await User.findOne({ email: 'studio.hirajewels@gmail.com' });
    
    if (!user) {
      user = new User({ email: 'studio.hirajewels@gmail.com' });
    }
    
    const hash = await bcrypt.hash('Admin@hirajewels', 10);
    user.role = 'ADMIN';
    user.password = hash;
    await user.save();
    
    console.log('User updated!');
    console.log('New Email:', user.email);
    console.log('Role:', user.role);
    process.exit(0);
  });
