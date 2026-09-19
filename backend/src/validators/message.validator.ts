import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.object({
    chatId: z.string().min(1, "Chat id is required"),
    content: z.string().optional().default(""),
    type: z.enum(["text", "image", "file"]).optional().default("text"),
    mediaUrl: z.string().url().optional().nullable(),
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    chatId: z.string().min(1, "Chat id is required"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const markReadSchema = z.object({
  params: z.object({
    chatId: z.string().min(1, "Chat id is required"),
  }),
});
