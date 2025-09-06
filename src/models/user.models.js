import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    fullName: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
