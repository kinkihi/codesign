import { z } from "zod";

export const actionNameSchema = z.enum([
  "open_project",
  "apply_preset",
  "export_still",
  "place_assets",
  "populate_along_path",
  "apply_style_pack",
  "set_camera",
  "render_video_clip",
  "replace_selection",
  "sync_workset",
]);

export type ActionName = z.infer<typeof actionNameSchema>;

export const collabContextSchema = z
  .object({
    workspace_id: z.string().optional(),
    workset_id: z.string().optional(),
    project_id: z.string().optional(),
  })
  .strict();

export const confirmationPolicySchema = z.enum(["auto", "require_user_approve"]);

export const actionEnvelopeSchema = z
  .object({
    idempotency_key: z.string().min(1),
    task_id: z.string().uuid(),
    action: actionNameSchema,
    payload: z.record(z.unknown()),
    confirmation: confirmationPolicySchema,
    requested_at: z.string().datetime({ offset: true }),
    collab_context: collabContextSchema.optional(),
  })
  .strict();

export type ActionEnvelope = z.infer<typeof actionEnvelopeSchema>;
