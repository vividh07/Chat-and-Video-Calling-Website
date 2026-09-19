import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { Env } from "../config/env.config";
import { verifyToken } from "../utils/jwt";
import UserModel from "../models/user.model";
import { registerChatHandlers } from "./chat.socket";
import { registerCallHandlers } from "./call.socket";
import { onlineUsers } from "./presence";
import { broadcastToChat } from "./broadcast";

let io: Server | null = null;

export { onlineUsers, broadcastToChat };
export const getIO = () => io;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: Env.FRONTEND_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.replace("Bearer ", "") as
          | string
          | undefined);

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyToken(token);
      const user = await UserModel.findById(payload.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const user = socket.data.user;
    const userId = user._id.toString();

    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    await UserModel.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    io?.emit("user:online", { userId });

    registerChatHandlers(io!, socket);
    registerCallHandlers(io!, socket);

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await UserModel.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io?.emit("user:offline", { userId, lastSeen: new Date() });
    });
  });

  return io;
};
