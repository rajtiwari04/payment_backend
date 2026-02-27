const Product = require('../models/Product');

const getCart = async (req, res) => {
  res.json({ success: true, message: 'Cart is managed client-side. Use order endpoints for checkout.' });
};

const validateCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    const validatedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found or unavailable` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
      validatedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || ''
      });
      subtotal += product.price * item.quantity;
    }
    const taxRate = 0.08;
    const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
    const shippingAmount = subtotal > 100 ? 0 : 9.99;
    const totalAmount = parseFloat((subtotal + taxAmount + shippingAmount).toFixed(2));
    res.json({
      success: true,
      validatedItems,
      pricing: { subtotal: parseFloat(subtotal.toFixed(2)), taxAmount, shippingAmount, totalAmount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCart, validateCart };
