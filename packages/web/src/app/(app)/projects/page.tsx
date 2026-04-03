import { FolderSimple } from "@phosphor-icons/react/dist/ssr";

export default function ProjectsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <FolderSimple size={20} weight="regular" />
        <h1 className="text-base font-semibold">Projects</h1>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-card">
          <FolderSimple size={24} weight="regular" className="text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-sm font-medium text-foreground">暂无项目</h2>
          <p className="text-[13px] text-muted-foreground">
            创建一个新项目开始管理您的设计工作
          </p>
        </div>
        <button className="mt-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/80">
          新建项目
        </button>
      </div>
    </div>
  );
}
