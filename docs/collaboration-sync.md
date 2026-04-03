# 协作与工作集同步模型

## 1. 工作集绑定

渲染器已有 **大型项目工作集拆分** — 在协作产品中引入显式绑定：

- `workspace_id`：协作空间（团队 + 项目上下文）。
- `project_id`：业务项目。
- `workset_id`：渲染器内工作集标识。
- `sync_mode`：`realtime` | `deferred` — 可按工作集体量覆盖默认策略。

Schema：`workspaceWorksetBindingSchema`（`packages/aec-protocol/src/collab.ts`）。

## 2. 同步域（Sync Domain）

| domain | 默认模式 | 说明 |
|--------|----------|------|
| `chat_thread` | realtime | 对话消息 |
| `design_doc` | realtime | 方案文档 / 结构化块 |
| `annotations` | realtime | 标注 |
| `camera_shots` | realtime | 镜头列表、参数 |
| `comments` | realtime | 评论 |
| `scene_heavy` | deferred | 重场景几何/大资源 |
| `asset_binaries` | deferred | 贴图/模型二进制 |
| `workset_delta` | deferred | 工作集变更集 |

默认数组：`DEFAULT_SYNC_POLICY`（同文件，可由租户配置覆盖）。

## 3. 消息信封

`CollabMessage` 用于 WebSocket 或 CRDT 适配层：

- `domain` + `op`（insert/update/delete/cursor/presence）
- `payload` 保持较小；大体量走对象存储 + 延迟任务引用 `artifact_uri`。

## 4. 与 Action Layer 的衔接

`ActionEnvelope.collab_context` 携带 `workspace_id` / `workset_id`，便于：

- 执行结果写回正确协作线程；
- 延迟同步完成后通知订阅者。

## 5. 实现选项

- **实时**：Liveblocks、Socket.io + OT、或 Yjs + WebRTC（按团队熟悉度选）。
- **延迟**：队列（SQS/Rabbit）+ 变更集版本号；冲突时「后写获胜」或渲染器侧合并规则文档化。
