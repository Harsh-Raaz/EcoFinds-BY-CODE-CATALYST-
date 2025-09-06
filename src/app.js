import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import purchaseRouter from "./routes/purchase.routes.js";
import healthcheckRoute from "./routes/healthcheck.routes.js";
//debugged typo of healthcheck.route to .routes
console.log("App.js loaded");

const app = express();

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true, limit: "32kb" }));
app.use(express.static("public"));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/purchases", purchaseRouter);
app.use("/api", healthcheckRoute);
//debugged typo of healthCheckRoute to healthcheckRoute

app.get("/", (req, res) => res.send("Welcome to EcoFinds API"));

export default app;
