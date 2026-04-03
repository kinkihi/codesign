"use client";

import Link from "next/link";
import { Lightbulb, PlugsConnected } from "@phosphor-icons/react";
import { CanvasIcon } from "@/components/icons";

const actions = [
  {
    icon: Lightbulb,
    title: "项目策划",
    description: "项目资料分析及汇报",
    href: "/chat/new?action=planning",
  },
  {
    icon: CanvasIcon,
    title: "无限画布",
    description: "自由发散、灵活编辑",
    href: "/canvas",
  },
  {
    icon: PlugsConnected,
    title: "链接",
    description: "设置连接其他工具",
    href: "/connections",
  },
];

export function QuickActions() {
  return (
    <div className="w-full max-w-[800px]">
      <div className="py-2">
        <span className="text-xs font-semibold text-muted-foreground">
          Quick Action
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex flex-col rounded-lg border border-border bg-card p-2 transition-colors hover:border-foreground/10 hover:bg-card/80"
          >
            <div className="flex items-center p-2">
              <action.icon
                size={16}
                weight="regular"
                className="text-foreground/60"
              />
            </div>
            <div className="flex flex-col gap-2 p-2">
              <span className="text-sm font-medium text-foreground">
                {action.title}
              </span>
              <span className="text-[13px] leading-5 text-muted-foreground">
                {action.description}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
