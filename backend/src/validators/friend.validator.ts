import { z } from "zod";

export const sendFriendRequestSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "User id is required"),
  }),
});

export const requestIdParamSchema = z.object({
  params: z.object({
    requestId: z.string().min(1),
  }),
});
