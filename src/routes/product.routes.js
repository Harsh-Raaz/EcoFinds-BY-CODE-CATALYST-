import express from "express";
import {
  createProduct, getProducts, getProductById, updateProduct, deleteProduct
} from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
  .get(getProducts)
  .post(authMiddleware, createProduct);

router.route("/:id")
  .get(getProductById)
  .put(authMiddleware, updateProduct)
  .delete(authMiddleware, deleteProduct);

export default router;
