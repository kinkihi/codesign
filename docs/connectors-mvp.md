# 资料连接器 MVP

## 1. 首发范围

| Connector | 场景 | MVP 实现要点 |
|-----------|------|----------------|
| **local_folder** | 本机项目目录、个人积累 | 仅 **Windows 桌面端** 监视；分块哈希增量；大文件后台队列 |
| **upload_buffer** | Web 拖拽、批量上传 | 直传对象存储；病毒扫描钩子；默认 ACL 为上传者 + 可选项目成员 |

后续迭代：`cloud_drive`（OAuth + delta）、`lan_smb`（元数据优先上云）、`marketplace_library`（与已购/企业库打通）。

## 2. 统一抽象

每个 Connector 暴露：

- `list_children`：列举与游标分页
- `incremental_sync`：基于 cursor / mtime / 内容哈希
- `pull_content`：按路径或 file_id 拉取字节流（受 ACL 约束）
- `subscribe_events`（可选）：本地文件夹 inotify 类事件

机读：`connectorConfigSchema`、`connectorCapabilitiesSchema`（`packages/aec-protocol/src/connectors.ts`）。

## 3. 索引分层

| 层 | 内容 |
|----|------|
| `metadata` | 路径、项目、标签、作者、时间、文件类型 |
| `text_layout` | PDF/Office 分页分块全文 |
| `vision_embedding` | 参考图、效果图、实景图向量 |
| `cad_lightweight` | 初期仅图层名、块名、属性；几何后移 |

大文件：点云/超大模型 → 渲染器或微服务生成 **摘要 + 关键截图** 再入 `vision_embedding` / `metadata`。

## 4. 权限模型

- **Collection**（资料集）级 ACL：`acl_principal_ids` 挂在索引 chunk 上（见 `indexedChunkSchema`）。
- 团队空间与个人空间分 Collection；AI 注入上下文前 **按主体过滤 chunk**。
- 企业版可叠加：**规范包**（白名单材料词表、禁止词）在编排层作为独立策略，不单依赖 Connector。

## 5. 产品交互

- 拖拽文件夹 → 异步索引；立即可用「文件名 + 粗摘要」检索。
- 对话 `@项目A`、`@标准库` 映射到 `collection_id` 过滤。
- NAS/网盘 Phase B 再开放 Connector 安装入口与合规说明（指纹/metadata-only 模式）。
