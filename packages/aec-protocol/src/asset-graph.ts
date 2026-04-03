import { z } from "zod";

/** 素材平台侧 listing / SKU */
export const marketplaceListingRefSchema = z
  .object({
    listing_id: z.string().min(1),
    sku: z.string().optional(),
    title: z.string().optional(),
    category_path: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    preview_uri: z.string().url().optional(),
    license_tier: z.enum(["free", "purchased", "enterprise", "unknown"]).optional(),
  })
  .strict();

/** 渲染器内资产（含变体、搭配） */
export const rendererAssetRefSchema = z
  .object({
    asset_uid: z.string().min(1),
    material_variant_id: z.string().optional(),
    style_pack_id: z.string().optional(),
  })
  .strict();

/**
 * 逻辑资产节点：跨「素材平台 ⇄ 渲染器」的稳定关联。
 * logical_asset_id 由云端 Asset Graph 服务分配（UUID）。
 */
export const assetGraphNodeSchema = z
  .object({
    logical_asset_id: z.string().uuid(),
    marketplace: marketplaceListingRefSchema.optional(),
    renderer: rendererAssetRefSchema.optional(),
    last_verified_at: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export type AssetGraphNode = z.infer<typeof assetGraphNodeSchema>;

/** 深链：打开渲染器并定位资产 */
export const rendererDeepLinkSchema = z
  .object({
    scheme: z.literal("codesign-renderer"),
    host: z.literal("asset"),
    logical_asset_id: z.string().uuid(),
    query: z
      .object({
        action: z.enum(["select", "replace", "preview"]).optional(),
        workset_id: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type RendererDeepLink = z.infer<typeof rendererDeepLinkSchema>;

export function formatRendererDeepLink(node: { logical_asset_id: string }, action?: "select" | "replace" | "preview") {
  const q = action ? `?action=${action}` : "";
  return `codesign-renderer://asset/${node.logical_asset_id}${q}`;
}
