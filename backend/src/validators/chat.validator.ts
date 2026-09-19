import { z } from "zod";

export const createPrivateChatSchema = z.object({
  body: z.object({
    participantId: z.string().min(1, "Participant id is required"),
  }),
});

export const createGroupChatSchema = z.object({
  body: z.object({
    groupName: z.string().min(2, "Group name must be at least 2 characters"),
    participantIds: z
      .array(z.string().min(1))
      .min(1, "At least one participant is required"),
  }),
});

export const chatIdParamSchema = z.object({
  params: z.object({
    chatId: z.string().min(1, "Chat id is required"),
  }),
});
