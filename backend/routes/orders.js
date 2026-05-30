const express = require('express');
const Order = require('../models/Order');
const { auth, requireAdmin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper to optionally get user from authorization header
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.['auth-token'];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const user = await User.findById(decoded.userId || decoded.id);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore and proceed as guest
  }
  next();
};

// GET all orders (Admin only)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('items.product').sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST create order (Public - guest or logged in)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      paymentMethod,
      notes,
      items,
      subtotal,
      shipping,
      tax,
      total
    } = req.body;

    if (!customerName || !customerEmail || !customerPhone || !customerAddress || !items || !items.length) {
      return res.status(400).json({ success: false, error: 'Missing required checkout fields' });
    }

    const orderData = {
      user: req.user ? req.user._id : undefined,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      paymentMethod,
      notes,
      items,
      subtotal,
      shipping,
      tax,
      total,
      status: 'PENDING',
      paymentStatus: 'PENDING'
    };

    const order = new Order(orderData);
    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET order by ID (Admin or the owner user)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    
    // Check if admin or the user who placed the order
    if (req.user.role !== 'ADMIN' && String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Unauthorized access' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PATCH update order status (Admin only)
router.patch('/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'WORKING', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.product');

    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE order (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
