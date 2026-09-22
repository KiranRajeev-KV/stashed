import { z } from "zod";

export const listTagsQuerySchema = z.object({
  q: z.string().trim().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;

export const suggestTagsSchema = z
  .object({
    title: z.string().trim().max(200),
    content: z.string().max(200_000),
    tags: z.array(z.string().trim().min(1).max(50)).max(19),
  })
  .strict();
