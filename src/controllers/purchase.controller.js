import asyncHandler from "../utils/async-handler.js";
import Purchase from "../models/purchase.models.js";
import Product from "../models/product.models.js";

// Add item to cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ message: "productId required" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  let cart = await Purchase.findOne({ userId: req.user._id, status: "cart" });
  if (!cart) {
    cart = await Purchase.create({ userId: req.user._id, items: [] });
  }

  const existing = cart.items.find(i => i.product.toString() === productId);
  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({ product: product._id, title: product.title, price: product.price, quantity: Number(quantity) });
  }
  await cart.save();
  res.status(200).json({ message: "Added to cart", cart });
});

// View cart
export const viewCart = asyncHandler(async (req, res) => {
  const cart = await Purchase.findOne({ userId: req.user._id, status: "cart" }).populate("items.product");
  res.status(200).json({ cart });
});

// Checkout (mark cart as purchased)
export const checkout = asyncHandler(async (req, res) => {
  const cart = await Purchase.findOne({ userId: req.user._id, status: "cart" });
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

  cart.status = "purchased";
  await cart.save();
  res.status(200).json({ message: "Checkout successful", purchase: cart });
});

// Get user purchases (status purchased)
export const getPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.find({ userId: req.user._id, status: "purchased" }).sort({ createdAt: -1 }).populate("items.product");
  res.status(200).json({ purchases });
});
