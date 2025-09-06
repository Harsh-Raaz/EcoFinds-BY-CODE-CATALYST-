const mongoose = require("mongoose");
const Product = require("./models/product");

mongoose.connect("mongodb://127.0.0.1:27017/ecofinds")
  .then(() => console.log(" MongoDB connected for seeding"))
  .catch(err => console.error("MongoDB connection error:", err));

const products = [
  {
    title: "Vintage Leather Jacket",
    description: "Gently used brown leather jacket",
    category: "Clothing",
    price: 75,
    image: "placeholder1.jpg"
  },
  {
    title: "Wireless Headphones",
    description: "Noise-cancelling headphones",
    category: "Electronics",
    price: 120,
    image: "placeholder2.jpg"
  },
  {
    title: "Wooden Coffee Table",
    description: "Solid oak coffee table",
    category: "Furniture",
    price: 60,
    image: "placeholder3.jpg"
  }
];

async function seedDB() {
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(" Database seeded with sample products");
  mongoose.connection.close();
}

seedDB();
