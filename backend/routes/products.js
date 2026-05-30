const express = require('express');
const Product = require('../models/Product');
const { auth, requireAdmin } = require('../middleware/auth');
const { v2: cloudinary } = require('cloudinary');

const router = express.Router();

const isCloudinaryConfigured =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function getProductImageUrls(productLike) {
  if (!productLike) return [];

  const images = [productLike.image, ...(Array.isArray(productLike.images) ? productLike.images : [])]
    .filter(Boolean)
    .filter((url) => typeof url === 'string');

  return Array.from(new Set(images));
}

function getCloudinaryPublicIdFromUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (!imageUrl.includes('res.cloudinary.com')) return null;

  try {
    const parsed = new URL(imageUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');

    if (uploadIndex === -1) return null;

    const publicIdSegments = segments.slice(uploadIndex + 1);
    if (!publicIdSegments.length) return null;

    if (/^v\d+$/.test(publicIdSegments[0])) {
      publicIdSegments.shift();
    }

    if (!publicIdSegments.length) return null;

    const lastSegment = publicIdSegments[publicIdSegments.length - 1];
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(/\.[^/.]+$/, '');

    const publicId = decodeURIComponent(publicIdSegments.join('/'));
    return publicId || null;
  } catch (error) {
    return null;
  }
}

async function deleteCloudinaryImagesByUrls(imageUrls) {
  if (!isCloudinaryConfigured || !Array.isArray(imageUrls) || !imageUrls.length) {
    return;
  }

  const publicIds = Array.from(
    new Set(
      imageUrls
        .map((url) => getCloudinaryPublicIdFromUrl(url))
        .filter(Boolean)
    )
  );

  if (!publicIds.length) return;

  const deletions = await Promise.allSettled(
    publicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
  );

  deletions.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to delete Cloudinary image: ${publicIds[index]}`, result.reason);
    }
  });
}

router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    // Return wrapped in success/data to match frontend expectations
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ success: false, error: 'Product not found' });

    const previousImageUrls = getProductImageUrls(existingProduct);

    existingProduct.set(req.body);
    const product = await existingProduct.save();

    const updatedImageUrls = getProductImageUrls(product);
    const removedImageUrls = previousImageUrls.filter((url) => !updatedImageUrls.includes(url));

    await deleteCloudinaryImagesByUrls(removedImageUrls);

    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const imageUrls = getProductImageUrls(product);
    await Product.deleteOne({ _id: product._id });
    await deleteCloudinaryImagesByUrls(imageUrls);

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
