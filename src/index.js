console.log("Index.js loaded"); // <- first log

import dotenv from "dotenv";
dotenv.config();

console.log("PORT:", process.env.PORT);
console.log("MONGO_URI:", process.env.MONGO_URI);

import app from "./app.js";
import connectDB from "./db/index.js";

const port = process.env.PORT || 3500;

connectDB()
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
