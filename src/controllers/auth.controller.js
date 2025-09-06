import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/async-handler.js";
import User from "../models/user.models.js";

// Register
export const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullName } = req.body;
  if (!email || !username || !password)
    return res
      .status(400)
      .json({ message: "email, username and password required" });

  const existed = await User.findOne({ $or: [{ email }, { username }] });
  if (existed) return res.status(409).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    username,
    password: hashedPassword,
    fullName,
  });

  res.status(201).json({
    message: "User registered",
    user: { id: user._id, username: user.username, email: user.email },
  });
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    },
  });
});

// Get profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  res.status(200).json({ user });
});

// Update profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { username, fullName } = req.body;
  const user = req.user;
  if (username) user.username = username;
  if (fullName) user.fullName = fullName;
  await user.save();
  res.status(200).json({ message: "Profile updated", user });
});
