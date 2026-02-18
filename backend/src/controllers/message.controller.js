import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * GET all contacts except logged-in user
 */


export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.error("getAllContacts error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * GET messages between logged-in user and another user
 */
export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("getMessagesByUserId error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * SEND a message (text or image)
 */
export const sendMessage = async (req, res) => {
  console.log("🔥 SEND MESSAGE API HIT");

  try {
    const senderId = req.user?._id;
    const { id: receiverId } = req.params;
    const { text, image } = req.body;

    console.log("SENDER:", senderId);
    console.log("RECEIVER:", receiverId);
    console.log("BODY:", req.body);

    // 🔴 HARD VALIDATIONS
    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId" });
    }

    if (!text?.trim() && !image) {
      return res.status(400).json({ message: "Text or image required" });
    }

    if (senderId.toString() === receiverId.toString()) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let imageUrl = null;
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imageUrl = upload.secure_url;
    }

    // 🔥 DATABASE SAVE (THIS MUST RUN)
    const message = await Message.create({
      senderId,
      receiverId,
      text: text?.trim() || "",
      image: imageUrl,
    });

    console.log("✅ MESSAGE SAVED:", message._id);

    // 🔌 SOCKET EMIT
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("❌ SEND MESSAGE ERROR:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET all chat partners for logged-in user
 */
export const getChatPartners = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    const partnerIds = [
      ...new Set(
        messages.map((m) =>
          m.senderId.toString() === userId.toString()
            ? m.receiverId.toString()
            : m.senderId.toString(),
        ),
      ),
    ];

    const partners = await User.find({
      _id: { $in: partnerIds },
    }).select("-password");

    res.status(200).json(partners);
  } catch (error) {
    console.error("getChatPartners error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
