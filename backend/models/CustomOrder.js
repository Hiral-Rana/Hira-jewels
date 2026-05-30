const mongoose = require('mongoose');

const customOrderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  designCategory: { type: String, required: true },
  note: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Reviewed', 'In Progress', 'Completed'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('CustomOrder', customOrderSchema);
