import MessageModel from "../models/message.model";
import ChatModel from "../models/chat.model";
import { BadRequestException } from "../utils/app-error";
import { assertChatParticipant } from "./chat.service";

export const getChatMessages = async (
  chatId: string,
  userId: string,
  page = 1,
  limit = 50
) => {
  await assertChatParticipant(chatId, userId);

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    MessageModel.find({ chat: chatId })
      .populate("sender", "name email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    MessageModel.countDocuments({ chat: chatId }),
  ]);

  return {
    messages: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const sendMessage = async (data: {
  chatId: string;
  senderId: string;
  content?: string;
  type?: "text" | "image" | "file";
  mediaUrl?: string | null;
}) => {
  await assertChatParticipant(data.chatId, data.senderId);

  const content = (data.content || "").trim();
  const type = data.type || "text";

  if (type === "text" && !content) {
    throw new BadRequestException("Message content is required");
  }

  if ((type === "image" || type === "file") && !data.mediaUrl && !content) {
    throw new BadRequestException("Media url or content is required");
  }

  const message = await MessageModel.create({
    chat: data.chatId,
    sender: data.senderId,
    content,
    type,
    mediaUrl: data.mediaUrl || null,
    readBy: [data.senderId],
  });

  await ChatModel.findByIdAndUpdate(data.chatId, {
    lastMessage: message._id,
    updatedAt: new Date(),
  });

  return MessageModel.findById(message._id).populate(
    "sender",
    "name email avatar"
  );
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  await MessageModel.updateMany(
    {
      chat: chatId,
      readBy: { $ne: userId },
    },
    { $addToSet: { readBy: userId } }
  );

  return { success: true };
};
