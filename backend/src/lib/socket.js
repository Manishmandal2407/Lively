import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

// map must be defined BEFORE usage
const userSocketMap = {}; // { userId: socketId }

const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

// Authenticate socket connections
io.use(socketAuthMiddleware);

// helper to get receiver socket id
export function getReceiverSocketId(userId) {
  return userSocketMap[userId?.toString()];
}

io.on("connection", (socket) => {
  const user = socket.user;
  const userId = user._id.toString();

  console.log("User connected:", user.fullName);

  userSocketMap[userId] = socket.id;

  // broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
