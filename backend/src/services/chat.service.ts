import mongoose from "mongoose";
import ChatModel from "../models/chat.model";
import UserModel from "../models/user.model";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "../utils/app-error";
import { canMessageUser } from "./friend.service";

export const assertChatParticipant = async (
  chatId: string,
  userId: string
) => {
  const chat = await ChatModel.findById(chatId);
  if (!chat) {
    throw new NotFoundException("Chat not found");
  }

  const isParticipant = chat.participants.some(
    (id) => id.toString() === userId
  );
  if (!isParticipant) {
    throw new ForbiddenException("You are not a participant of this chat");
  }

  return chat;
};

export const getUserChats = async (userId: string) => {
  const chats = await ChatModel.find({ participants: userId })
    .populate(
      "participants",
      "name email avatar isOnline lastSeen isPrivate isHidden bio"
    )
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name avatar" },
    })
    .sort({ updatedAt: -1 });

  return chats;
};

export const getChatById = async (chatId: string, userId: string) => {
  await assertChatParticipant(chatId, userId);

  const chat = await ChatModel.findById(chatId)
    .populate(
      "participants",
      "name email avatar isOnline lastSeen isPrivate isHidden bio"
    )
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name avatar" },
    });

  return chat;
};

export const createPrivateChat = async (
  userId: string,
  participantId: string
) => {
  if (userId === participantId) {
    throw new BadRequestException("Cannot create a chat with yourself");
  }

  if (!mongoose.Types.ObjectId.isValid(participantId)) {
    throw new BadRequestException("Invalid participant id");
  }

  const participant = await UserModel.findById(participantId);
  if (!participant) {
    throw new NotFoundException("Participant not found");
  }

  const existing = await ChatModel.findOne({
    isGroup: false,
    participants: { $all: [userId, participantId], $size: 2 },
  })
    .populate(
      "participants",
      "name email avatar isOnline lastSeen isPrivate isHidden bio"
    )
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "name avatar" },
    });

  if (existing) {
    return existing;
  }

  const allowed = await canMessageUser(userId, participantId);
  if (!allowed) {
    throw new ForbiddenException(
      "This account is private. Send a friend request and wait for approval before messaging."
    );
  }

  const chat = await ChatModel.create({
    participants: [userId, participantId],
    isGroup: false,
    createdBy: userId,
  });

  return ChatModel.findById(chat._id)
    .populate(
      "participants",
      "name email avatar isOnline lastSeen isPrivate isHidden bio"
    )
    .populate("lastMessage");
};

export const createGroupChat = async (
  userId: string,
  groupName: string,
  participantIds: string[]
) => {
  const uniqueIds = [...new Set(participantIds.filter((id) => id !== userId))];

  if (uniqueIds.length === 0) {
    throw new BadRequestException("Add at least one other participant");
  }

  const invalid = uniqueIds.some((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalid) {
    throw new BadRequestException("One or more participant ids are invalid");
  }

  const users = await UserModel.find({ _id: { $in: uniqueIds } });
  if (users.length !== uniqueIds.length) {
    throw new NotFoundException("One or more participants were not found");
  }

  const chat = await ChatModel.create({
    participants: [userId, ...uniqueIds],
    isGroup: true,
    groupName,
    createdBy: userId,
  });

  return ChatModel.findById(chat._id)
    .populate("participants", "name email avatar isOnline lastSeen")
    .populate("lastMessage");
};
