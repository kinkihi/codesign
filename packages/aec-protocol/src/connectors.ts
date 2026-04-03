import { z } from "zod";

export const connectorKindSchema = z.enum([
  "local_folder",
  "upload_buffer",
  "cloud_drive",
  "lan_smb",
  "marketplace_library",
]);

export type ConnectorKind = z.infer<typeof connectorKindSchema>;

/** Connector 对外能力（实现侧据此开发适配器） */
export const connectorCapabilitiesSchema = z
  .object({
    list_children: z.boolean(),
    incremental_sync: z.boolean(),
    pull_content: z.boolean(),
    subscribe_events: z.boolean().optional(),
  })
  .strict();

export const connectorConfigBaseSchema = z
  .object({
    connector_id: z.string().uuid(),
    kind: connectorKindSchema,
    display_name: z.string().min(1),
    collection_id: z.string().uuid().describe("归属资料集，用于 ACL 与 RAG 作用域"),
    capabilities: connectorCapabilitiesSchema,
    created_at: z.string().datetime({ offset: true }),
  })
  .strict();

export const localFolderConnectorConfigSchema = connectorConfigBaseSchema.extend({
  kind: z.literal("local_folder"),
  root_path: z.string().min(1),
  ignore_globs: z.array(z.string()).optional(),
});

export const uploadBufferConnectorConfigSchema = connectorConfigBaseSchema.extend({
  kind: z.literal("upload_buffer"),
  max_total_bytes: z.number().int().positive().optional(),
});

/** MVP 首发：local_folder + upload_buffer */
export const connectorConfigSchema = z.discriminatedUnion("kind", [
  localFolderConnectorConfigSchema,
  uploadBufferConnectorConfigSchema,
  z
    .object({
      connector_id: z.string().uuid(),
      kind: z.literal("cloud_drive"),
      display_name: z.string().min(1),
      collection_id: z.string().uuid(),
      capabilities: connectorCapabilitiesSchema,
      created_at: z.string().datetime({ offset: true }),
      provider: z.string().min(1),
      oauth_connection_id: z.string().min(1),
    })
    .strict(),
  z
    .object({
      connector_id: z.string().uuid(),
      kind: z.literal("lan_smb"),
      display_name: z.string().min(1),
      collection_id: z.string().uuid(),
      capabilities: connectorCapabilitiesSchema,
      created_at: z.string().datetime({ offset: true }),
      smb_root: z.string().min(1),
      metadata_only_mode: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      connector_id: z.string().uuid(),
      kind: z.literal("marketplace_library"),
      display_name: z.string().min(1),
      collection_id: z.string().uuid(),
      capabilities: connectorCapabilitiesSchema,
      created_at: z.string().datetime({ offset: true }),
      library_scope: z.enum(["purchased", "enterprise", "favorites"]),
    })
    .strict(),
]);

export type ConnectorConfig = z.infer<typeof connectorConfigSchema>;

/** 索引分层（与文档 connectors-mvp 一致） */
export const indexLayerSchema = z.enum([
  "metadata",
  "text_layout",
  "vision_embedding",
  "cad_lightweight",
]);

export const indexedChunkSchema = z
  .object({
    chunk_id: z.string().uuid(),
    collection_id: z.string().uuid(),
    connector_id: z.string().uuid(),
    source_path: z.string().min(1),
    layer: indexLayerSchema,
    text: z.string().optional(),
    embedding_model: z.string().optional(),
    acl_principal_ids: z.array(z.string()).describe("可访问该 chunk 的主体 ID"),
  })
  .strict();

export type IndexedChunk = z.infer<typeof indexedChunkSchema>;
