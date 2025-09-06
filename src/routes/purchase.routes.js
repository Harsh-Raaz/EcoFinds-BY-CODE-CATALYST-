import express from "express";
import { addToCart, viewCart, checkout, getPurchases } from "../controllers/purchase.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/cart/add", authMiddleware, addToCart);
router.get("/cart", authMiddleware, viewCart);
router.post("/cart/checkout", authMiddleware, checkout);
router.get("/", authMiddleware, getPurchases);

export default router;
