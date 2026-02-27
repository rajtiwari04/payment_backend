const Order = require('../models/Order');
const Product = require('../models/Product');

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items provided' });
    }
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not available: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
      orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity, image: product.images[0] || '' });
      subtotal += product.price * item.quantity;
    }
    const taxAmount = parseFloat((subtotal * 0.08).toFixed(2));
    const shippingAmount = subtotal > 100 ? 0 : 9.99;
    const totalAmount = parseFloat((subtotal + taxAmount + shippingAmount).toFixed(2));

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'card',
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount,
      shippingAmount,
      totalAmount,
      notes
    });
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt').populate('transaction').lean();
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('transaction').lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getOrders, getOrder };
