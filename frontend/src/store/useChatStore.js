import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  // ================= STATE =================
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  // ================= UI HELPERS =================
  toggleSound: () => {
    const next = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", JSON.stringify(next));
    set({ isSoundEnabled: next });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (user) => set({ selectedUser: user, messages: [] }),

  // ================= API CALLS =================
  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    if (!userId) return;

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ================= SEND MESSAGE (FIXED) =================
  sendMessage: async ({ text = "", image = null }) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();

    // ---------- HARD GUARDS ----------
    if (!selectedUser?._id) {
      toast.error("Invalid chat user");
      return;
    }

    if (selectedUser._id === authUser._id) {
      toast.error("You cannot message yourself");
      return;
    }

    if (!text.trim() && !image) {
      return;
    }

    // ---------- OPTIMISTIC MESSAGE ----------
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: text.trim(),
      image,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      // ---------- REAL SAVE (DB) ----------
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        { text: text.trim(), image },
      );

      // ---------- REPLACE OPTIMISTIC ----------
      set({
        messages: get().messages.map((msg) =>
          msg._id === tempId ? res.data : msg,
        ),
      });
    } catch (err) {
      // ---------- ROLLBACK ----------
      set({
        messages: get().messages.filter((msg) => msg._id !== tempId),
      });

      toast.error(err.response?.data?.message || "Message failed");
    }
  },

  // ================= SOCKET =================
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser, isSoundEnabled } = get();

    if (!socket || !selectedUser?._id) return;

    socket.on("newMessage", (newMessage) => {
      // 🔒 IMPORTANT: normalize ObjectIds
      const senderId =
        typeof newMessage.senderId === "object"
          ? newMessage.senderId._id
          : newMessage.senderId;

      if (senderId?.toString() !== selectedUser._id.toString()) return;

      set({ messages: [...get().messages, newMessage] });

      if (isSoundEnabled) {
        const audio = new Audio("/sounds/notification.mp3");
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },
}));
