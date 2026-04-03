import { PlugsConnected } from "@phosphor-icons/react/dist/ssr";

const connectors = [
  {
    name: "本地文件夹",
    description: "连接本地项目文件夹，自动索引文档与资料",
    status: "available" as const,
  },
  {
    name: "渲染器",
    description: "连接 Windows 渲染器，执行自动摆放与出图",
    status: "available" as const,
  },
  {
    name: "素材平台",
    description: "关联已购素材库，用于对话推荐和自动布置",
    status: "coming_soon" as const,
  },
  {
    name: "云盘同步",
    description: "OAuth 授权连接第三方云盘，同步项目资料",
    status: "coming_soon" as const,
  },
];

export default function ConnectionsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <PlugsConnected size={20} weight="regular" />
        <h1 className="text-base font-semibold">Connections</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid max-w-3xl gap-3">
          {connectors.map((connector) => (
            <div
              key={connector.name}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">
                  {connector.name}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {connector.description}
                </span>
              </div>
              {connector.status === "available" ? (
                <button className="shrink-0 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
                  连接
                </button>
              ) : (
                <span className="shrink-0 rounded-md px-3 py-1.5 text-xs text-muted-foreground">
                  即将推出
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
