"use client";

import { useState } from "react";
import { SkillsIcon } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const skills = [
  {
    name: "方案汇报",
    description: "基于项目资料生成结构化汇报文档，含分析与推荐",
    category: "策划",
    detail:
      "自动提取项目中的关键数据与设计意图，生成包含现状分析、方案对比、推荐理由的结构化汇报文档，支持导出为 PDF 或 PPT 格式。",
    usage: "在对话中输入 /方案汇报 并上传项目资料",
    instructions: [
      {
        title: "适用场景",
        items: [
          "向客户或领导汇报方案进展与推荐",
          "需要快速整理多版本方案的核心差异",
          "项目资料较多，需自动提炼关键信息",
        ],
      },
      {
        title: "工作流程",
        items: [
          "上传项目资料（图纸、文档、参考图等）",
          "AI 分析资料提取核心信息与设计意图",
          "生成结构化汇报文档，包含分析与推荐",
          "支持导出 PDF / PPT 格式，一键分享",
        ],
      },
    ],
  },
  {
    name: "自动摆放",
    description: "根据空间意图与素材推荐，在渲染器中自动布置家具与配饰",
    category: "室内",
    detail:
      "基于空间功能区划和风格偏好，智能推荐并自动摆放家具、配饰、装饰画等元素，支持一键调整布局密度与风格倾向。",
    usage: "在对话中输入 /自动摆放 并选择目标空间",
    instructions: [
      {
        title: "适用场景",
        items: [
          "快速填充空旷室内空间的家具与软装",
          "根据不同风格需求切换整套摆放方案",
          "调整空间布局密度，优化动线与视觉效果",
        ],
      },
      {
        title: "工作流程",
        items: [
          "选择目标空间区域",
          "描述空间功能与风格偏好",
          "AI 推荐家具组合并自动布置",
          "支持手动微调位置与替换单品",
        ],
      },
    ],
  },
  {
    name: "灯光设计",
    description: "智能推荐灯光方案并生成预设，一键应用到渲染器",
    category: "室内",
    detail:
      "分析空间结构与使用场景，自动生成包含主灯、辅灯、氛围灯的完整灯光方案，支持色温、亮度、光照范围的精细调节。",
    usage: "在对话中输入 /灯光设计 并描述期望氛围",
    instructions: [
      {
        title: "适用场景",
        items: [
          "为室内空间快速配置完整灯光方案",
          "切换日景/夜景/特定氛围的灯光预设",
          "精细调节单个灯源的参数以匹配设计意图",
        ],
      },
      {
        title: "工作流程",
        items: [
          "描述目标空间的灯光氛围需求",
          "AI 分析空间结构，推荐灯光布局方案",
          "自动配置主灯、辅灯、氛围灯参数",
          "一键应用到渲染器并支持实时预览",
        ],
      },
    ],
  },
  {
    name: "景观植物配置",
    description: "沿路径或区域自动散布植物，支持密度与品种控制",
    category: "景观",
    detail:
      "根据气候区域和设计风格，沿路径或指定区域自动配置植物组合，支持乔木、灌木、地被的分层控制，可调节种植密度与随机度。",
    usage: "在对话中输入 /景观植物配置 并框选区域",
    instructions: [
      {
        title: "适用场景",
        items: [
          "沿道路或区域边界自动配置绿化",
          "根据气候条件筛选适宜植物品种",
          "控制乔木、灌木、地被的分层种植效果",
        ],
      },
      {
        title: "工作流程",
        items: [
          "框选目标种植区域或路径",
          "设置气候区域与设计风格偏好",
          "AI 推荐植物组合并自动散布",
          "支持调节种植密度、随机度与品种比例",
        ],
      },
    ],
  },
  {
    name: "材质替换",
    description: "对话描述需求，自动匹配并替换场景中的材质",
    category: "通用",
    detail:
      "通过自然语言描述材质需求（如「换成暖色木纹地板」），自动从材质库中匹配最佳选项并替换到场景中，支持批量操作。",
    usage: "在对话中输入 /材质替换 并描述目标材质",
    instructions: [
      {
        title: "适用场景",
        items: [
          "快速替换地板、墙面、台面等表面材质",
          "通过自然语言描述替代手动浏览材质库",
          "对多个物体批量应用同一材质",
        ],
      },
      {
        title: "工作流程",
        items: [
          "选择目标对象或描述替换范围",
          "用自然语言描述目标材质（如「暖色木纹」）",
          "AI 从材质库匹配最佳选项",
          "确认后一键替换，支持批量操作",
        ],
      },
    ],
  },
  {
    name: "出图预设",
    description: "一键应用渲染设置，导出高质量效果图",
    category: "通用",
    detail:
      "内置多种专业出图预设（日景、夜景、鸟瞰、室内氛围等），一键配置渲染参数、后处理效果和输出分辨率，快速导出高质量效果图。",
    usage: "在对话中输入 /出图预设 并选择预设模板",
    instructions: [
      {
        title: "适用场景",
        items: [
          "快速切换日景、夜景、鸟瞰等出图风格",
          "统一团队的渲染输出标准与质量",
          "需要批量导出不同角度的效果图",
        ],
      },
      {
        title: "工作流程",
        items: [
          "选择出图预设模板（日景/夜景/鸟瞰等）",
          "一键配置渲染参数与后处理效果",
          "设置输出分辨率与格式",
          "导出高质量效果图",
        ],
      },
    ],
  },
];

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex h-[16px] w-[28px] shrink-0 cursor-pointer items-center rounded-full border border-border/60 p-[2px] transition-colors ${
        enabled ? "bg-foreground" : "bg-foreground/10"
      }`}
    >
      <span
        className={`block size-[10px] rounded-full bg-white shadow-[0_0_4px_rgba(0,0,0,0.3)] transition-transform ${
          enabled ? "translate-x-[12px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function ChatIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.19565 12.8472C6.37191 13.528 7.7556 13.7577 9.08875 13.4936C10.4219 13.2295 11.6135 12.4896 12.4414 11.4118C13.2693 10.334 13.677 8.99183 13.5885 7.63561C13.5 6.27938 12.9213 5.00163 11.9603 4.0406C10.9993 3.07956 9.72157 2.50082 8.3654 2.41229C7.00924 2.32376 5.66716 2.73147 4.58939 3.55942C3.51161 4.38736 2.77171 5.57902 2.50763 6.91223C2.24355 8.24544 2.47331 9.62919 3.15407 10.8055L2.42436 12.9842C2.39694 13.0665 2.39296 13.1547 2.41287 13.2391C2.43277 13.3234 2.47578 13.4006 2.53707 13.4619C2.59835 13.5232 2.6755 13.5662 2.75985 13.5861C2.84421 13.606 2.93244 13.602 3.01466 13.5746L5.19565 12.8472Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SkillsPage() {
  const [enabledSkills, setEnabledSkills] = useState<Record<string, boolean>>(
    () => Object.fromEntries(skills.map((s) => [s.name, true]))
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <SkillsIcon size={20} />
        <h1 className="flex-1 text-base font-semibold">Skills</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="-my-1 h-8 bg-foreground text-background hover:bg-foreground/90"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 3V11M3 7H11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              创建 Skill
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.19565 12.8472C6.37191 13.528 7.7556 13.7577 9.08875 13.4936C10.4219 13.2295 11.6135 12.4896 12.4414 11.4118C13.2693 10.334 13.677 8.99183 13.5885 7.63561C13.5 6.27938 12.9213 5.00163 11.9603 4.0406C10.9993 3.07956 9.72157 2.50082 8.3654 2.41229C7.00924 2.32376 5.66716 2.73147 4.58939 3.55942C3.51161 4.38736 2.77171 5.57902 2.50763 6.91223C2.24355 8.24544 2.47331 9.62919 3.15407 10.8055L2.42436 12.9842C2.39694 13.0665 2.39296 13.1547 2.41287 13.2391C2.43277 13.3234 2.47578 13.4006 2.53707 13.4619C2.59835 13.5232 2.6755 13.5662 2.75985 13.5861C2.84421 13.606 2.93244 13.602 3.01466 13.5746L5.19565 12.8472Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              聊天创建
            </DropdownMenuItem>
            <DropdownMenuItem>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 10V3M8 3L5.5 5.5M8 3L10.5 5.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 10V12.5H13V10"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              上传 Skill
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex-1 overflow-auto p-10">
        <div className="flex flex-wrap gap-4">
          {skills.map((skill) => (
            <Dialog key={skill.name}>
              <DialogTrigger asChild>
                <button
                  className="flex w-[calc(33.333%-11px)] cursor-pointer flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded border border-border bg-white">
                      <SkillsIcon size={14} className="text-neutral-900" />
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        /{skill.name}
                      </span>
                      <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {skill.category}
                      </span>
                    </div>
                    {enabledSkills[skill.name] ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0"
                      >
                        <path
                          d="M2.5 8L6 11.5L12.833 4.5"
                          stroke="black"
                          strokeOpacity="0.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEnabledSkills((prev) => ({
                            ...prev,
                            [skill.name]: true,
                          }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            setEnabledSkills((prev) => ({
                              ...prev,
                              [skill.name]: true,
                            }));
                          }
                        }}
                        className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6 2.5V9.5M2.5 6H9.5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs leading-5 text-muted-foreground">
                    {skill.description}
                  </p>
                </button>
              </DialogTrigger>
              <DialogContent
                showCloseButton={false}
                className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-[800px]"
              >
                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                  {/* Header + description + detail */}
                  <div className="flex flex-col gap-2 p-6">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded border border-border bg-white">
                        <SkillsIcon
                          size={14}
                          className="text-neutral-900"
                        />
                      </div>
                      <div className="flex flex-1 items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          /{skill.name}
                        </span>
                        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {skill.category}
                        </span>
                      </div>
                      <Toggle
                        enabled={enabledSkills[skill.name] ?? true}
                        onToggle={() =>
                          setEnabledSkills((prev) => ({
                            ...prev,
                            [skill.name]: !prev[skill.name],
                          }))
                        }
                      />
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {skill.description}
                    </p>
                    <p className="text-xs leading-5 text-foreground">
                      {skill.detail}
                    </p>
                  </div>

                  {/* Instructions box */}
                  <div className="px-6">
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex flex-col gap-3 text-xs leading-5 text-foreground">
                        {skill.instructions.map((section) => (
                          <div key={section.title}>
                            <p className="font-medium">{section.title}</p>
                            <ul className="mt-1 list-disc pl-5 text-foreground/80">
                              {section.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky footer */}
                <div className="flex shrink-0 items-center justify-between px-6 py-4">
                  <p className="text-xs text-muted-foreground">
                    使用方法：{skill.usage}
                  </p>
                  <Button variant="outline" size="sm">
                    <ChatIcon />
                    使用
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </div>
  );
}
