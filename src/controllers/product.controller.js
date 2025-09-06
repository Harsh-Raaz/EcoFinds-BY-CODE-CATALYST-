import asyncHandler from "../utils/async-handler.js";
import Product from "../models/product.models.js";

// Create product (auth required)
export const createProduct = asyncHandler(async (req, res) => {
  const { title, description, category, price, image } = req.body;
  if (!title || !description || !category || price === undefined) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const product = await Product.create({
    userId: req.user._id,
    title,
    description,
    category,
    price,
    image,
  });
  res.status(201).json({ message: "Product created", product });
});

// Get products (browse) with category & keyword
export const getProducts = asyncHandler(async (req, res) => {
  const { category, keyword, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (keyword) filter.title = { $regex: keyword, $options: "i" };

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("userId", "username");
  const total = await Product.countDocuments(filter);
  res
    .status(200)
    .json({ products, page: Number(page), limit: Number(limit), total });
});

// Get single product
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "userId",
    "username"
  );
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.status(200).json({ product });
});

// Update product (owner only)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (product.userId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Unauthorized" });

  Object.assign(product, req.body);
  await product.save();
  res.status(200).json({ message: "Product updated", product });
});

// Delete product (owner only)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  if (product.userId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Unauthorized" });
  await product.remove();
  res.status(200).json({ message: "Product deleted" });
});
