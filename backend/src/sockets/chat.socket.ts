import { Server, Socket } from "socket.io";
import { sendMessage, markMessagesAsRead } from "../services/message.service";
import ChatModel from "../models/chat.model";
import { broadcastToChat } from "./broadcast";

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const user = socket.data.user;
  const userId = user._id.toString();

  socket.on("chat:join", async (chatId: string) => {
    try {
      const id = String(chatId);
      const chat = await ChatModel.findById(id);
      if (!chat) return;

      const isParticipant = chat.participants.some(
        (pid) => pid.toString() === userId
      );
      if (!isParticipant) return;

      socket.join(id);
      socket.emit("chat:joined", { chatId: id });
    } catch {
      socket.emit("error", { message: "Failed to join chat" });
    }
  });

  socket.on("chat:leave", (chatId: string) => {
    socket.leave(String(chatId));
  });

  socket.on(
    "message:send",
    async (payload: {
      chatId: string;
      content?: string;
      type?: "text" | "image" | "file";
      mediaUrl?: string | null;
    }) => {
      try {
        const chatId = String(payload.chatId);
        const message = await sendMessage({
          chatId,
          senderId: userId,
          content: payload.content,
          type: payload.type,
          mediaUrl: payload.mediaUrl,
        });

        const plain = message?.toJSON ? message.toJSON() : message;
        await broadcastToChat(io, chatId, "message:new", plain);
      } catch (error: any) {
        socket.emit("error", {
          message: error?.message || "Failed to send message",
        });
      }
    }
  );

  socket.on("message:read", async (chatId: string) => {
    try {
      const id = String(chatId);
      await markMessagesAsRead(id, userId);
      await broadcastToChat(io, id, "message:read", { chatId: id, userId });
    } catch (error: any) {
      socket.emit("error", {
        message: error?.message || "Failed to mark messages as read",
      });
    }
  });

  socket.on("typing:start", async (payload: { chatId: string }) => {
    const chatId = String(payload.chatId);
    const data = { chatId, userId, name: user.name };
    socket.to(chatId).emit("typing:start", data);
    const chat = await ChatModel.findById(chatId).select("participants");
    chat?.participants.forEach((pid) => {
      const id = pid.toString();
      if (id !== userId) io.to(`user:${id}`).emit("typing:start", data);
    });
  });

  socket.on("typing:stop", async (payload: { chatId: string }) => {
    const chatId = String(payload.chatId);
    const data = { chatId, userId };
    socket.to(chatId).emit("typing:stop", data);
    const chat = await ChatModel.findById(chatId).select("participants");
    chat?.participants.forEach((pid) => {
      const id = pid.toString();
      if (id !== userId) io.to(`user:${id}`).emit("typing:stop", data);
    });
  });
};
