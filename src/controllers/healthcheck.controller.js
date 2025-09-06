import asyncHandler from "../utils/async-handler.js";

export const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json({ statusCode: 200, message: "Server is running" });
});
