import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  getChatMessages,
  markMessagesAsRead,
  sendMessage,
} from "../services/message.service";
import { getIO } from "../sockets";
import { broadcastToChat } from "../sockets/broadcast";
import { uploadImageBuffer } from "../utils/upload";
import { BadRequestException } from "../utils/app-error";
import { assertChatParticipant } from "../services/chat.service";

export const getMessagesController = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);

    const result = await getChatMessages(
      req.params.chatId,
      req.user!._id.toString(),
      page,
      limit
    );

    return res.status(HTTPSTATUS.OK).json(result);
  }
);

export const uploadChatImageController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      throw new BadRequestException("Image file is required");
    }

    const chatId = String(req.body.chatId || "");
    if (!chatId) {
      throw new BadRequestException("Chat id is required");
    }

    await assertChatParticipant(chatId, req.user!._id.toString());

    const url = await uploadImageBuffer(req.file.buffer, "chat-images");

    return res.status(HTTPSTATUS.OK).json({
      message: "Image uploaded",
      url,
    });
  }
);

export const sendMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const message = await sendMessage({
      chatId: req.body.chatId,
      senderId: req.user!._id.toString(),
      content: req.body.content,
      type: req.body.type,
      mediaUrl: req.body.mediaUrl,
    });

    const io = getIO();
    if (message) {
      const plain = (message as any).toJSON ? (message as any).toJSON() : message;
      await broadcastToChat(io, req.body.chatId, "message:new", plain);
    }

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Message sent",
      data: message,
    });
  }
);

export const markReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await markMessagesAsRead(
      req.params.chatId,
      req.user!._id.toString()
    );

    const io = getIO();
    await broadcastToChat(io, req.params.chatId, "message:read", {
      chatId: req.params.chatId,
      userId: req.user!._id.toString(),
    });

    return res.status(HTTPSTATUS.OK).json(result);
  }
);
