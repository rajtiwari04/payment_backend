const Product = require('../models/Product');

const getImageUrl = (product) => {
  const query = `${product.name} ${product.category} ${product.brand}`;
  return `https://source.unsplash.com/400x400/?${encodeURIComponent(query)}&sig=${product.name}`;
};

module.exports = getImageUrl;