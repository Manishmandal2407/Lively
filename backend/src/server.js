import "dotenv/config";
import { arcjetProtection } from "./middleware/arcjet.middleware.js";
import cors from "cors"

import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json()); //req.body
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(arcjetProtection); // ck


app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

app.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
  connectDB();
});
