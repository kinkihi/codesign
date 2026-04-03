# 渲染器动作协议（Action Layer）

## 1. 目标

将云端 **Agent 编排器** 与 **Windows 渲染器** 之间的自动化能力规范为：**可校验的 JSON 动作**、**幂等任务**、**可审计回传**。自然语言仅在编排层消化，不得直接透传到渲染器进程。

## 2. 架构角色

| 组件 | 职责 |
|------|------|
| **Agent Orchestrator** | LLM 工具调用产出 `ActionEnvelope`；校验 Schema；写入任务队列 |
| **Local Executor** | 安装在用户机器（常与渲染器同机）；拉取/订阅任务；调用渲染器脚本或 C#/插件 API |
| **Renderer** | 执行具体布置、出图、导出；返回缩略图路径或二进制、工程变更句柄 |

## 3. Phase A 最小动作集（建议优先实现）

与落地计划 Phase A 对齐，用于闭环验证：

| `action` | 说明 |
|----------|------|
| `open_project` | 打开指定工程文件（路径或云端下发的已同步 URI） |
| `apply_preset` | 应用渲染/环境/风格预设（映射到渲染器内部 preset_id） |
| `export_still` | 导出单帧静图（分辨率、输出路径或上传槽位） |

## 4. 完整动作枚举（后续阶段）

| `action` | 说明 |
|----------|------|
| `place_assets` | 按 asset_uid 与变换批量布置 |
| `apply_style_pack` | 应用「搭配」组合 |
| `set_camera` | 设置机位、焦距、裁剪 |
| `render_video_clip` | 导出指定时长视频（如 5s） |
| `replace_selection` | 替换当前选中对象的素材/材质 |
| `sync_workset` | 与工作集拆分功能对齐的增量同步 |

## 5. 信封格式 `ActionEnvelope`

所有动作共用外层字段（见 `packages/aec-protocol` 中 `actionEnvelopeSchema`）：

- **`idempotency_key`**：同一键重复提交须返回同一逻辑结果，避免重复布置/重复出图。
- **`task_id`**：全局唯一任务 ID（UUID v4）。
- **`action`**：动作名（上表）。
- **`payload`**：动作专属载荷。
- **`confirmation`**：`auto` / `require_user_approve`；高敏操作（覆盖工程、批量删除）须为后者。
- **`requested_at`**：ISO-8601 时间。
- **`collab_context`**（可选）：`workspace_id`、`workset_id`，用于与协作空间对齐。

## 6. 执行结果 `ActionResult`

Local Executor 在完成后向云端回传：

- **`task_id`**
- **`status`**：`pending` | `running` | `succeeded` | `failed` | `cancelled` | `awaiting_user`
- **`renderer_build`**（可选）：渲染器版本号，便于排错
- **`artifacts`**：缩略图 URL/base64 占位、导出文件 URI、diff 描述
- **`error`**：`code`、`message`、`detail`（不含敏感路径时可脱敏）

## 7. 传输与安全

- 设备 **配对**：一次性 code + 短期 token；刷新 token 轮换。
- **TLS** 必选；局域网可选 mTLS（企业部署）。
- 全链路 **审计日志**：who / device / task_id / action / outcome。

## 8. HTTP/WebSocket 草案

见 [`specs/openapi/local-executor.yaml`](../specs/openapi/local-executor.yaml)：任务入队、轮询/订阅状态、心跳。

## 9. 机读定义

TypeScript/Zod：`packages/aec-protocol/src/actions/*`
