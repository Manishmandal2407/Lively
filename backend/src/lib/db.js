import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
  try {
    const { MONGODB_URI } = ENV;

    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not set");
    }

    const conn = await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected to DB:", conn.connection.name);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};
