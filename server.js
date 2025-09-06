const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");


const Product = require("./models/product");
const Cart = require("./models/cart");

const app = express();
const PORT = 5000;


app.use(bodyParser.json());
app.use(cors());


mongoose.connect("mongodb://127.0.0.1:27017/ecofinds")
  .then(() => console.log(" MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));


app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});


app.get("/products/search", async (req, res) => {
  const keyword = req.query.q;
  try {
    const results = await Product.find({ title: { $regex: keyword, $options: "i" } });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});


app.get("/products/category/:category", async (req, res) => {
  const category = req.params.category;
  try {
    const results = await Product.find({ category });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Category filter failed" });
  }
});


app.get("/cart/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate("products");
    res.json(cart || { userId: req.params.userId, products: [] });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});


app.post("/cart/:userId/add", async (req, res) => {
  const { productId } = req.body;
  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) cart = new Cart({ userId: req.params.userId, products: [] });
    cart.products.push(productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
});


app.post("/cart/:userId/remove", async (req, res) => {
  const { productId } = req.body;
  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (cart) {
      cart.products = cart.products.filter(p => p.toString() !== productId);
      await cart.save();
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});


app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
