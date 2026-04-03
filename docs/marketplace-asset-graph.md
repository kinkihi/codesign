# 素材平台资产图谱与深链

## 1. 目标

- 对话与方案输出使用 **稳定 `logical_asset_id`**，避免模型编造不存在的 SKU。
- 同一逻辑资产同时映射：**素材平台 listing** 与 **渲染器 `asset_uid`**（及材质变体、搭配 ID）。
- 用户一键 **跳转渲染器定位** 或 **跳转素材页购买/已购详情**。

## 2. 字段约定

### 2.1 素材平台（Marketplace）

| 字段 | 说明 |
|------|------|
| `listing_id` | 平台主键，必选 |
| `sku` | 可选，用于 ERP/对账 |
| `title`, `category_path`, `tags` | 检索与卡片展示 |
| `preview_uri` | HTTPS 缩略图 |
| `license_tier` | `free` / `purchased` / `enterprise` — RAG 与推荐时过滤未授权内容 |

**接口依赖（早期对齐）**：资源唯一 ID、授权查询、搜索/过滤 API（标签、类目、分页）。

### 2.2 渲染器（Renderer）

| 字段 | 说明 |
|------|------|
| `asset_uid` | 库内实例或资源主键 |
| `material_variant_id` | 可选 |
| `style_pack_id` | 与「搭配」概念对齐 |

### 2.3 逻辑节点 `AssetGraphNode`

- `logical_asset_id`：UUID，由 **Asset Graph 服务** 签发。
- `marketplace` / `renderer` 至少一端非空；双端齐全时可做 **双向校验**。
- `last_verified_at`：最近一次 ID 校验时间（用于定时对账任务）。

机读 Schema：`packages/aec-protocol/src/asset-graph.ts` 中 `assetGraphNodeSchema`。

## 3. 生成一致性策略

1. **检索阶段**：仅召回用户有权素材（已购/企业库/免费）。
2. **生成阶段**：系统提示要求引用 `logical_asset_id` 或 `listing_id`；禁止虚构。
3. **后置校验**：对模型输出做正则/JSON 解析 → 查 Asset Graph；若不存在则 **向量最近邻替换** 并 UI 提示。

## 4. 深链 Scheme

推荐格式：

```text
codesign-renderer://asset/{logical_asset_id}?action=select&workset_id=...
```

- `action`：`select` | `replace` | `preview`
- Local Executor 或渲染器注册该 scheme，校验 token 后执行。

辅助函数：`formatRendererDeepLink()`（见 `aec-protocol`）。

## 5. 与 OpenAPI / 任务协议的关系

`ActionEnvelope` 内 `place_assets`、`replace_selection` 等载荷中的 `asset_uid` 应能通过 Asset Graph **解析回** `listing_id`，以便会话卡片展示「购买/已购」状态。
