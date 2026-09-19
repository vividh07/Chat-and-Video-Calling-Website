import { z } from "zod";

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.coerce.string().trim().min(1, "Search query is required"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    bio: z.string().max(280).optional(),
    avatar: z.string().url().optional().nullable(),
    isPrivate: z.boolean().optional(),
    isHidden: z.boolean().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});
