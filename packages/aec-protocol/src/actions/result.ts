import { z } from "zod";

export const actionStatusSchema = z.enum([
  "pending",
  "running",
  "succeeded",
  "failed",
  "cancelled",
  "awaiting_user",
]);

export const artifactKindSchema = z.enum([
  "thumbnail",
  "still_image",
  "video",
  "scene_delta",
  "log",
]);

export const artifactSchema = z
  .object({
    kind: artifactKindSchema,
    uri: z.string().optional(),
    mime_type: z.string().optional(),
    meta: z.record(z.unknown()).optional(),
  })
  .strict();

export const actionErrorSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
    detail: z.record(z.unknown()).optional(),
  })
  .strict();

export const actionResultSchema = z
  .object({
    task_id: z.string().uuid(),
    status: actionStatusSchema,
    renderer_build: z.string().optional(),
    artifacts: z.array(artifactSchema).optional(),
    error: actionErrorSchema.optional(),
  })
  .strict();

export type ActionResult = z.infer<typeof actionResultSchema>;
