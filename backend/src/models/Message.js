import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
