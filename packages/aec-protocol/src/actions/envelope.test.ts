import { describe, expect, it } from "vitest";
import { actionEnvelopeSchema } from "./envelope.js";
import { validateActionEnvelope } from "./validate-envelope.js";

describe("ActionEnvelope", () => {
  it("accepts Phase A open_project", () => {
    const raw = {
      idempotency_key: "k1",
      task_id: "550e8400-e29b-41d4-a716-446655440000",
      action: "open_project",
      payload: { project_uri: "D:\\Projects\\site.cproj", read_only: true },
      confirmation: "auto",
      requested_at: "2026-04-01T12:00:00.000Z",
    };
    const env = actionEnvelopeSchema.parse(raw);
    expect(() => validateActionEnvelope(env)).not.toThrow();
  });

  it("rejects bad payload for export_still", () => {
    const raw = {
      idempotency_key: "k2",
      task_id: "550e8400-e29b-41d4-a716-446655440001",
      action: "export_still",
      payload: { width: -1 },
      confirmation: "auto",
      requested_at: "2026-04-01T12:00:00.000Z",
    };
    const env = actionEnvelopeSchema.parse(raw);
    expect(() => validateActionEnvelope(env)).toThrow();
  });

  it("accepts populate_along_path with path_id", () => {
    const raw = {
      idempotency_key: "k-path",
      task_id: "550e8400-e29b-41d4-a716-446655440002",
      action: "populate_along_path",
      payload: {
        target_zone_id: "zone_garden_01",
        path_id: "path_session_abc",
        assets: { mode: "explicit", asset_uids: Array.from({ length: 3 }, (_, i) => `plant_${i}`) },
        placement: { mode: "by_count", count: 100 },
        rng_seed: 42,
      },
      confirmation: "require_user_approve",
      requested_at: "2026-04-01T12:00:00.000Z",
    };
    const env = actionEnvelopeSchema.parse(raw);
    expect(() => validateActionEnvelope(env)).not.toThrow();
  });

  it("rejects populate_along_path without path_id or polyline", () => {
    const raw = {
      idempotency_key: "k-path-bad",
      task_id: "550e8400-e29b-41d4-a716-446655440003",
      action: "populate_along_path",
      payload: {
        target_zone_id: "zone_garden_01",
        assets: { mode: "pool", asset_pool_id: "pool_trees" },
        placement: { mode: "by_spacing", spacing_m: 1.2 },
      },
      confirmation: "auto",
      requested_at: "2026-04-01T12:00:00.000Z",
    };
    const env = actionEnvelopeSchema.parse(raw);
    expect(() => validateActionEnvelope(env)).toThrow();
  });

  it("rejects populate_along_path polyline without scene_up", () => {
    const raw = {
      idempotency_key: "k-path-up",
      task_id: "550e8400-e29b-41d4-a716-446655440004",
      action: "populate_along_path",
      payload: {
        target_zone_id: "zone_garden_01",
        path_polyline: [
          [0, 0, 0],
          [10, 0, 0],
        ],
        assets: { mode: "explicit", asset_uids: ["a"] },
        placement: { mode: "by_count", count: 5 },
      },
      confirmation: "auto",
      requested_at: "2026-04-01T12:00:00.000Z",
    };
    const env = actionEnvelopeSchema.parse(raw);
    expect(() => validateActionEnvelope(env)).toThrow();
  });

  it("accepts place_assets with §16 batch orchestration fields", () => {
    const raw = {
      idempotency_key: "k-batch",
      task_id: "550e8400-e29b-41d4-a716-446655440005",
      action: "place_assets",
      payload: {
        items: [{ asset_uid: "sku_a" }, { asset_uid: "sku_b" }],
        batch_id: "660e8400-e29b-41d4-a716-446655440000",
        spatial_context_revision: "zones_v3",
        chunk_index: 0,
        chunk_total: 4,
        placement_order: "by_zone_then_footprint_desc",
        on_partial_failure: "continue",
        bulk_mode: "pragmatic",
        user_batch_ack_id: "ack_turn_42",
        chunk_timeout_sec: 120,
      },
      confirmation: "require_user_approve",
      requested_at: "2026-04-01T12:00:00.000Z",
    };
    const env = actionEnvelopeSchema.parse(raw);
    expect(() => validateActionEnvelope(env)).not.toThrow();
  });

  it("rejects place_assets pragmatic bulk_mode without user_batch_ack_id", () => {
    const raw = {
      idempotency_key: "k-batch-bad",
      task_id: "550e8400-e29b-41d4-a716-446655440006",
      action: "place_assets",
      payload: {
        items: [{ asset_uid: "sku_a" }],
        bulk_mode: "pragmatic",
      },
      confirmation: "auto",
      requested_at: "2026-04-01T12:00:00.000Z",
    };
    const env = actionEnvelopeSchema.parse(raw);
    expect(() => validateActionEnvelope(env)).toThrow();
  });

  it("rejects place_assets chunk_index without chunk_total", () => {
    const raw = {
      idempotency_key: "k-chunk",
      task_id: "550e8400-e29b-41d4-a716-446655440007",
      action: "place_assets",
      payload: {
        items: [{ asset_uid: "sku_a" }],
        chunk_index: 1,
      },
      confirmation: "auto",
      requested_at: "2026-04-01T12:00:00.000Z",
    };
    const env = actionEnvelopeSchema.parse(raw);
    expect(() => validateActionEnvelope(env)).toThrow();
  });
});
