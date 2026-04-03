# CoDesign AI — AEC 可视化工作流协议与规范

本仓库承载 **AEC 可视化工作流 AI 产品** 的跨产品集成规范：渲染器动作协议、素材资产图谱、资料连接器 MVP、客户端架构与协作同步模型。

- **人读文档**：[`docs/`](docs/)（含 [扩展与集成](docs/extensions-and-integrations.md)）
- **机读协议**：[`packages/aec-protocol`](packages/aec-protocol)（Zod + TypeScript 类型）
- **HTTP 草案**：[`specs/openapi/local-executor.yaml`](specs/openapi/local-executor.yaml)

## 快速开始

```bash
cd packages/aec-protocol && npm install && npm run build && npm test
```

渲染器团队请优先阅读 [`docs/renderer-action-protocol.md`](docs/renderer-action-protocol.md)；素材平台与云端编排服务请阅读 [`docs/marketplace-asset-graph.md`](docs/marketplace-asset-graph.md)。
