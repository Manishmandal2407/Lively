import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import cookie from "cookie";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie
      ? cookie.parse(socket.handshake.headers.cookie)
      : null;

    const token = cookies?.jwt;

    if (!token) {
      return next(new Error("Unauthorized - No Token"));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return next(new Error("Unauthorized - User not found"));
    }

    socket.user = user;
    socket.userId = user._id.toString();

    next();
  } catch (error) {
    console.log("Socket auth error:", error.message);
    return next(new Error("Unauthorized"));
  }
};
