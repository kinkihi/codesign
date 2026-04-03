# Web + 桌面客户端架构（MVP）

## 1. 目标

- **类 Claude/Codex 体验**：对话、项目空间、资料引用、任务卡片（含渲染进度）。
- **跨系统**：首版 **Windows 桌面** 与 **Web**；后续 macOS 复用同一壳层逻辑。
- **跨端同步**：账号、会话列表、项目元数据、轻量文档 **实时**；大文件与场景 **延迟队列**。

## 2. 技术栈建议

| 层级 | 建议 | 说明 |
|------|------|------|
| UI | **React + TypeScript** | Web 与桌面共享组件库（如 shadcn + Tailwind） |
| 桌面壳 | **Tauri 2**（首选）或 Electron | Tauri 更小体积；需调用本地 FS/进程时用 Rust sidecar |
| 状态与数据 | TanStack Query + 协作通道 | 会话 REST；协作 WebSocket/CRDT 服务 |
| 身份 | OIDC / 自建 JWT + Refresh | 与现有用户体系统一；企业 SSO 预留 |

## 3. 职责划分

- **Web**：注册登录、团队协作、上传、RAG 对话、素材卡片跳转、订阅通知。
- **桌面**：本地文件夹 Connector、**Local Executor**、渲染器深链、离线任务队列（网络恢复后重放）。
- **渲染器**：保持为主力 DCC 宿主；通过已有或新增 **自动化 API** 接收动作（见 `renderer-action-protocol.md`）。

## 4. 同步策略摘要

与 [`collaboration-sync.md`](collaboration-sync.md) 一致：聊天与设计文档实时；场景二进制与工作集 delta 延迟。桌面与 Web 共享同一 `workspace_id` / `workset_id` 绑定模型（`aec-protocol` 中 `workspaceWorksetBindingSchema`）。

## 5. 共享代码

- `packages/aec-protocol`：前后端与 Executor 共用的 Zod/类型。
- 可选后续 monorepo 包：`ui-kit`、`api-client`（由 OpenAPI 生成）。

## 6. 安全

- 桌面端存储 refresh token 使用系统钥匙串（Tauri plugin / node-keytar）。
- Local Executor 仅监听 localhost 或 mTLS 入站；配对码一次性。
