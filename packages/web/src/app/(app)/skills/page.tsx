import { SquaresFour } from "@phosphor-icons/react/dist/ssr";

const skills = [
  {
    name: "自动摆放",
    description: "根据空间意图与素材推荐，在渲染器中自动布置家具与配饰",
    category: "室内",
  },
  {
    name: "方案汇报",
    description: "基于项目资料生成结构化汇报文档，含分析与推荐",
    category: "策划",
  },
  {
    name: "灯光设计",
    description: "智能推荐灯光方案并生成预设，一键应用到渲染器",
    category: "室内",
  },
  {
    name: "景观植物配置",
    description: "沿路径或区域自动散布植物，支持密度与品种控制",
    category: "景观",
  },
  {
    name: "材质替换",
    description: "对话描述需求，自动匹配并替换场景中的材质",
    category: "通用",
  },
  {
    name: "出图预设",
    description: "一键应用渲染设置，导出高质量效果图",
    category: "通用",
  },
];

export default function SkillsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <SquaresFour size={20} weight="regular" />
        <h1 className="text-base font-semibold">Skills</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-3">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {skill.name}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                  {skill.category}
                </span>
              </div>
              <p className="text-[13px] leading-5 text-muted-foreground">
                {skill.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
