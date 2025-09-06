import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    image: { type: String, default: "placeholder.jpg" },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
