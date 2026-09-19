import ChatModel from "../models/chat.model";

export const broadcastToChat = async (
  io: any,
  chatId: string,
  event: string,
  payload: unknown
) => {
  if (!io) return;
  const id = String(chatId);
  io.to(id).emit(event, payload);

  const chat = await ChatModel.findById(id).select("participants");
  if (!chat) return;

  for (const participantId of chat.participants) {
    io.to(`user:${participantId.toString()}`).emit(event, payload);
  }
};
