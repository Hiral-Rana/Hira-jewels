const express = require('express');
const WishlistItem = require('../models/WishlistItem');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const items = await WishlistItem.find({ user: req.user._id }).populate('product');
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    let item = await WishlistItem.findOne({ user: req.user._id, product: productId });
    if (!item) {
      item = new WishlistItem({ user: req.user._id, product: productId });
      await item.save();
    }
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:productId', auth, async (req, res) => {
  try {
    await WishlistItem.findOneAndDelete({ user: req.user._id, product: req.params.productId });
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
