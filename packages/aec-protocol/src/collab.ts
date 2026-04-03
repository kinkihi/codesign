import { z } from "zod";

/** 协作空间与渲染器工作集映射 */
export const workspaceWorksetBindingSchema = z
  .object({
    workspace_id: z.string().uuid(),
    project_id: z.string().uuid(),
    workset_id: z.string().min(1).describe("渲染器工作集 ID"),
    sync_mode: z.enum(["realtime", "deferred"]),
    bound_at: z.string().datetime({ offset: true }),
  })
  .strict();

export type WorkspaceWorksetBinding = z.infer<typeof workspaceWorksetBindingSchema>;

/** 同步域：何种数据走实时、何种走延迟 */
export const syncDomainSchema = z.enum([
  "chat_thread",
  "design_doc",
  "annotations",
  "camera_shots",
  "comments",
  "scene_heavy",
  "asset_binaries",
  "workset_delta",
]);

export const syncPolicyEntrySchema = z
  .object({
    domain: syncDomainSchema,
    mode: z.enum(["realtime", "deferred"]),
    max_payload_bytes_hint: z.number().int().optional(),
  })
  .strict();

export const defaultSyncPolicySchema = z.array(syncPolicyEntrySchema);

/** 默认策略（可在服务端按租户覆盖） */
export const DEFAULT_SYNC_POLICY: z.infer<typeof defaultSyncPolicySchema> = [
  { domain: "chat_thread", mode: "realtime" },
  { domain: "design_doc", mode: "realtime" },
  { domain: "annotations", mode: "realtime" },
  { domain: "camera_shots", mode: "realtime" },
  { domain: "comments", mode: "realtime" },
  { domain: "scene_heavy", mode: "deferred", max_payload_bytes_hint: 50_000_000 },
  { domain: "asset_binaries", mode: "deferred", max_payload_bytes_hint: 500_000_000 },
  { domain: "workset_delta", mode: "deferred" },
];

/** 协作消息信封（WebSocket / CRDT 通道可复用） */
export const collabMessageSchema = z
  .object({
    message_id: z.string().uuid(),
    workspace_id: z.string().uuid(),
    domain: syncDomainSchema,
    op: z.enum(["insert", "update", "delete", "cursor", "presence"]),
    payload: z.record(z.unknown()),
    issued_at: z.string().datetime({ offset: true }),
    author_id: z.string().min(1),
  })
  .strict();

export type CollabMessage = z.infer<typeof collabMessageSchema>;
