const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: 'USER' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
