import mongoose from "mongoose";
const { Schema } = mongoose;

const itemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  title: String,
  price: Number,
  quantity: { type: Number, default: 1 },
});

const purchaseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [itemSchema],
    status: { type: String, enum: ["cart", "purchased"], default: "cart" },
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
