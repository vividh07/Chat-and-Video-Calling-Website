import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  createGroupChat,
  createPrivateChat,
  getChatById,
  getUserChats,
} from "../services/chat.service";

export const getChatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const chats = await getUserChats(req.user!._id.toString());
    return res.status(HTTPSTATUS.OK).json({ chats });
  }
);

export const getChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const chat = await getChatById(
      req.params.chatId,
      req.user!._id.toString()
    );
    return res.status(HTTPSTATUS.OK).json({ chat });
  }
);

export const createPrivateChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const chat = await createPrivateChat(
      req.user!._id.toString(),
      req.body.participantId
    );
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Chat ready",
      chat,
    });
  }
);

export const createGroupChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const chat = await createGroupChat(
      req.user!._id.toString(),
      req.body.groupName,
      req.body.participantIds
    );
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Group created",
      chat,
    });
  }
);
