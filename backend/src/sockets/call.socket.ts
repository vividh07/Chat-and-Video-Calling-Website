import { Server, Socket } from "socket.io";
import { onlineUsers } from "./presence";

type CallPayload = {
  to: string;
  from?: string;
  chatId?: string;
  callType?: "audio" | "video";
  offer?: unknown;
  answer?: unknown;
  candidate?: unknown;
  reason?: string;
};

export const registerCallHandlers = (io: Server, socket: Socket) => {
  const user = socket.data.user;
  const userId = user._id.toString();

  socket.on("call:initiate", (payload: CallPayload) => {
    const targetSocketId = onlineUsers.get(payload.to);
    if (!targetSocketId) {
      socket.emit("call:unavailable", {
        to: payload.to,
        reason: "User is offline",
      });
      return;
    }

    io.to(targetSocketId).emit("call:incoming", {
      from: userId,
      fromName: user.name,
      fromAvatar: user.avatar,
      chatId: payload.chatId,
      callType: payload.callType || "video",
      offer: payload.offer,
    });
  });

  socket.on("call:accept", (payload: CallPayload) => {
    const targetSocketId = onlineUsers.get(payload.to);
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call:accepted", {
      from: userId,
      answer: payload.answer,
      chatId: payload.chatId,
    });
  });

  socket.on("call:reject", (payload: CallPayload) => {
    const targetSocketId = onlineUsers.get(payload.to);
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call:rejected", {
      from: userId,
      reason: payload.reason || "Call rejected",
      chatId: payload.chatId,
    });
  });

  socket.on("call:offer", (payload: CallPayload) => {
    const targetSocketId = onlineUsers.get(payload.to);
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call:offer", {
      from: userId,
      offer: payload.offer,
      chatId: payload.chatId,
    });
  });

  socket.on("call:answer", (payload: CallPayload) => {
    const targetSocketId = onlineUsers.get(payload.to);
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call:answer", {
      from: userId,
      answer: payload.answer,
      chatId: payload.chatId,
    });
  });

  socket.on("call:ice-candidate", (payload: CallPayload) => {
    const targetSocketId = onlineUsers.get(payload.to);
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call:ice-candidate", {
      from: userId,
      candidate: payload.candidate,
      chatId: payload.chatId,
    });
  });

  socket.on("call:end", (payload: CallPayload) => {
    const targetSocketId = onlineUsers.get(payload.to);
    if (!targetSocketId) return;

    io.to(targetSocketId).emit("call:ended", {
      from: userId,
      chatId: payload.chatId,
      reason: payload.reason || "Call ended",
    });
  });
};
