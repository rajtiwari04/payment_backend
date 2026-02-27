const Product = require('../models/Product');
const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Product.countDocuments(query)
    ]);
    res.json({
      success: true,
      products,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const seedProducts = async (req, res) => {
  try {
    const sampleProducts = [
      { name: 'MacBook Pro 16"', description: 'Apple M3 Pro chip, 18GB RAM, 512GB SSD', price: 2499.99, category: 'Electronics', brand: 'Apple', stock: 15, images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'] },
      { name: 'Sony WH-1000XM5', description: 'Industry-leading noise canceling wireless headphones', price: 349.99, category: 'Electronics', brand: 'Sony', stock: 30, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'] },
      { name: 'Nike Air Max 270', description: 'Mens running shoes with Air Max cushioning', price: 149.99, category: 'Clothing', brand: 'Nike', stock: 50, images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'] },
      { name: 'Clean Code Book', description: 'A Handbook of Agile Software Craftsmanship by Robert Martin', price: 39.99, category: 'Books', brand: 'Prentice Hall', stock: 100, images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'] },
      { name: 'Samsung 4K Smart TV 55"', description: 'Crystal UHD 4K Smart TV with Alexa Built-in', price: 699.99, category: 'Electronics', brand: 'Samsung', stock: 20, images: ['https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400'] },
      { name: 'Instant Pot Duo 7-in-1', description: 'Electric pressure cooker 6 quart, multi-use', price: 89.99, category: 'Home', brand: 'Instant Pot', stock: 45, images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=400'] },
      { name: 'Yoga Mat Premium', description: 'Non-slip 6mm thick eco-friendly exercise mat', price: 59.99, category: 'Sports', brand: 'Manduka', stock: 80, images: ['https://images.unsplash.com/photo-1601925228196-99c2e1fa4f62?w=400'] },
      { name: 'iPad Air 5th Gen', description: 'M1 chip, 10.9-inch Liquid Retina display, 64GB', price: 749.99, category: 'Electronics', brand: 'Apple', stock: 25, images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'] }
    ];
    await Product.insertMany(sampleProducts.map(p => ({ ...p, createdBy: req.user._id })));
    res.json({ success: true, message: `${sampleProducts.length} products seeded` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, seedProducts };
