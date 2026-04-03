import { z } from "zod";

/** open_project */
export const openProjectPayloadSchema = z
  .object({
    project_uri: z.string().min(1).describe("本地路径、file:// 或已同步的云端 object key"),
    read_only: z.boolean().optional(),
  })
  .strict();

/** apply_preset */
export const applyPresetPayloadSchema = z
  .object({
    preset_id: z.string().min(1).describe("渲染器内部稳定 ID"),
    scope: z.enum(["global", "selection", "workset"]).optional(),
  })
  .strict();

/** export_still */
export const exportStillPayloadSchema = z
  .object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    output: z
      .object({
        mode: z.enum(["local_path", "upload_slot"]),
        path: z.string().optional(),
        upload_slot_id: z.string().optional(),
      })
      .strict(),
    camera_id: z.string().optional(),
  })
  .strict();

/** place_assets — 编排扩展对齐 docs/codesign-auto-placement-requirements.md §16 */
export const placeAssetsPlacementOrderSchema = z.enum([
  "as_list",
  "by_zone_then_footprint_desc",
  "topology_dag",
]);

export const placeAssetsOnPartialFailureSchema = z.enum(["continue", "abort", "rollback_batch"]);

export const placeAssetsBulkModeSchema = z.enum(["conservative", "pragmatic"]);

export const placeAssetsPayloadSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            asset_uid: z.string().min(1).describe("渲染器资产实例或库 ID"),
            transform: z
              .object({
                position: z.tuple([z.number(), z.number(), z.number()]).optional(),
                rotation_deg: z.tuple([z.number(), z.number(), z.number()]).optional(),
                scale: z.tuple([z.number(), z.number(), z.number()]).optional(),
              })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .min(1),
    parent_node_id: z.string().optional(),
    batch_id: z.string().uuid().optional().describe("逻辑批次，对应一次用户确认的摆放"),
    spatial_context_revision: z.string().optional().describe("Zone Catalog 版本或 hash，避免分片间漂移"),
    chunk_index: z.number().int().nonnegative().optional(),
    chunk_total: z.number().int().positive().optional(),
    chunk_max_items: z.number().int().positive().optional().describe("产品侧分片阈值提示"),
    placement_order: placeAssetsPlacementOrderSchema.optional(),
    on_partial_failure: placeAssetsOnPartialFailureSchema.optional(),
    bulk_mode: placeAssetsBulkModeSchema.optional(),
    user_batch_ack_id: z
      .string()
      .min(1)
      .optional()
      .describe("bulk_mode=pragmatic 时必填，可审计的用户确认令牌"),
    chunk_timeout_sec: z.number().positive().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.bulk_mode === "pragmatic" && (val.user_batch_ack_id == null || val.user_batch_ack_id.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bulk_mode 为 pragmatic 时必须提供 user_batch_ack_id",
        path: ["user_batch_ack_id"],
      });
    }
    const hasIdx = val.chunk_index != null;
    const hasTotal = val.chunk_total != null;
    if (hasIdx !== hasTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "chunk_index 与 chunk_total 需同时提供或同时省略",
        path: ["chunk_index"],
      });
    }
    if (
      val.chunk_index != null &&
      val.chunk_total != null &&
      val.chunk_index >= val.chunk_total
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "chunk_index 须小于 chunk_total",
        path: ["chunk_index"],
      });
    }
  });

export type PlaceAssetsPayload = z.infer<typeof placeAssetsPayloadSchema>;

/**
 * populate_along_path — 沿路径工具轨批量散布（对齐 docs/codesign-auto-placement-requirements.md §4.8）
 */
export const populateAlongPathPayloadSchema = z
  .object({
    target_zone_id: z.string().min(1).describe("Zone Catalog 区域 ID，须与花园等室外/室内分区一致"),
    path_id: z.string().min(1).optional().describe("渲染器内路径工具生成的稳定句柄"),
    path_polyline: z
      .array(z.tuple([z.number(), z.number(), z.number()]))
      .optional()
      .describe("世界坐标折线控制点；与 path_id 二选一"),
    scene_up: z.enum(["+Y", "+Z", "-Y", "-Z"]).optional().describe("使用 path_polyline 时必填，用于校验与投射"),
    assets: z
      .discriminatedUnion("mode", [
        z
          .object({
            mode: z.literal("explicit"),
            asset_uids: z.array(z.string().min(1)).min(1).describe("显式 SKU / 资产 ID 列表，执行器按策略抽样"),
          })
          .strict(),
        z
          .object({
            mode: z.literal("pool"),
            asset_pool_id: z.string().min(1),
            pool_selection: z.enum(["random", "weighted", "round_robin"]).optional(),
          })
          .strict(),
      ])
      .describe("植物池或显式列表"),
    placement: z
      .discriminatedUnion("mode", [
        z.object({ mode: z.literal("by_count"), count: z.number().int().positive() }).strict(),
        z.object({ mode: z.literal("by_spacing"), spacing_m: z.number().positive() }).strict(),
      ])
      .describe("按棵数或按间距沿路径填充"),
    rng_seed: z.number().int().optional().describe("可复现随机散布"),
    offset_from_path_m: z.number().optional().describe("沿法线偏移（米），正负由渲染器约定"),
    random_yaw_deg: z.tuple([z.number(), z.number()]).optional().describe("绕 scene_up 的 yaw 抖动区间"),
    scale_jitter: z.tuple([z.number(), z.number()]).optional().describe("等比缩放抖动区间"),
    assignment_source: z
      .enum(["user_explicit", "catalog_tag", "agent_structured", "heuristic"])
      .optional(),
    placement_volume_id: z.string().optional().describe("可选，收紧与 zone 绑定的体积"),
  })
  .strict()
  .superRefine((val, ctx) => {
    const hasPathId = val.path_id != null && val.path_id.length > 0;
    const poly = val.path_polyline;
    const hasPoly = poly != null && poly.length >= 2;
    if (!hasPathId && !hasPoly) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "必须提供 path_id 或至少 2 个点的 path_polyline",
        path: ["path_id"],
      });
    }
    if (hasPoly && val.scene_up == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "提供 path_polyline 时必须提供 scene_up",
        path: ["scene_up"],
      });
    }
  });

export type PopulateAlongPathPayload = z.infer<typeof populateAlongPathPayloadSchema>;

/** apply_style_pack */
export const applyStylePackPayloadSchema = z
  .object({
    style_pack_id: z.string().min(1),
    target_scope: z.enum(["scene", "selection", "layer"]).optional(),
    target_id: z.string().optional(),
  })
  .strict();

/** set_camera */
export const setCameraPayloadSchema = z
  .object({
    camera_id: z.string().optional(),
    eye: z.tuple([z.number(), z.number(), z.number()]).optional(),
    target: z.tuple([z.number(), z.number(), z.number()]).optional(),
    fov_deg: z.number().positive().optional(),
  })
  .strict();

/** render_video_clip */
export const renderVideoClipPayloadSchema = z
  .object({
    duration_sec: z.number().positive(),
    fps: z.number().positive().optional(),
    output: z
      .object({
        mode: z.enum(["local_path", "upload_slot"]),
        path: z.string().optional(),
        upload_slot_id: z.string().optional(),
      })
      .strict(),
    camera_path_id: z.string().optional(),
  })
  .strict();

/** replace_selection */
export const replaceSelectionPayloadSchema = z
  .object({
    asset_uid: z.string().min(1),
    preserve_transform: z.boolean().optional(),
  })
  .strict();

/** sync_workset */
export const syncWorksetPayloadSchema = z
  .object({
    workset_id: z.string().min(1),
    direction: z.enum(["pull", "push"]),
    revision_hint: z.string().optional(),
  })
  .strict();

const payloadByAction = {
  open_project: openProjectPayloadSchema,
  apply_preset: applyPresetPayloadSchema,
  export_still: exportStillPayloadSchema,
  place_assets: placeAssetsPayloadSchema,
  populate_along_path: populateAlongPathPayloadSchema,
  apply_style_pack: applyStylePackPayloadSchema,
  set_camera: setCameraPayloadSchema,
  render_video_clip: renderVideoClipPayloadSchema,
  replace_selection: replaceSelectionPayloadSchema,
  sync_workset: syncWorksetPayloadSchema,
} as const;

export function parseActionPayload(action: keyof typeof payloadByAction, payload: unknown) {
  return payloadByAction[action].parse(payload);
}
