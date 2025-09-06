const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  price: Number,
  image: String
});

module.exports = mongoose.model("Product", productSchema);
