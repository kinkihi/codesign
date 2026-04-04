"use client";

import { useState } from "react";
import { FolderSimple, Plus, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  coverColor: string;
  coverImage?: string;
}

const projects: Project[] = [
  {
    id: "1",
    name: "Project name",
    updatedAt: "Jan 26, 2026",
    coverColor: "from-rose-300/60 via-orange-200/40 to-transparent",
    coverImage: "/project-cover-1.png",
  },
  {
    id: "2",
    name: "Design Sprint",
    updatedAt: "Feb 12, 2026",
    coverColor: "from-slate-200/60 via-slate-100/40 to-transparent",
  },
  {
    id: "3",
    name: "User Research",
    updatedAt: "Mar 3, 2026",
    coverColor: "from-sky-200/60 via-sky-100/40 to-transparent",
  },
  {
    id: "4",
    name: "Prototype Testing",
    updatedAt: "Apr 15, 2026",
    coverColor: "from-emerald-200/60 via-emerald-100/40 to-transparent",
  },
];

const COVER_PATH =
  "M0 15C0 6.716 6.716 0 15 0H140.7C148.984 0 155.7 6.716 155.7 15V51.403C155.7 53.792 155.13 56.146 154.036 58.269L142.964 79.776C141.87 81.9 141.3 84.254 141.3 86.642V225C141.3 233.284 134.584 240 126.3 240H15C6.716 240 0 233.284 0 225V15Z";

const COVER_STROKE =
  "M15 0.75H140.7C148.57 0.75 154.95 7.13 154.95 15V51.403C154.95 53.672 154.408 55.909 153.369 57.926L142.297 79.433C141.149 81.662 140.55 84.135 140.55 86.642V225C140.55 232.87 134.17 239.25 126.3 239.25H15C7.13 239.25 0.75 232.87 0.75 225V15C0.75 7.13 7.13 0.75 15 0.75Z";

type FilterType = "all" | "personal" | "team";
type SortType = "updated" | "name" | "created";

function ProjectCard({ project }: { project: Project }) {
  const clipId = `cover-clip-${project.id}`;
  return (
    <div className="project-card relative h-[240px] w-[180px] cursor-pointer">
      {/* Folder BG shell */}
      <div className="pointer-events-none absolute inset-0 rounded-[14px] border-[1.5px] border-border/60 bg-muted/40 dark:bg-[#1a1d22]" />
      {/* Back file — stays in place */}
      <div className="absolute inset-[6%_8%] rounded-lg border-[1.5px] border-black/8 bg-white dark:border-white/6 dark:bg-[#1a1d22]" />
      {/* Front file — slides out & rotates on hover, stays below cover */}
      <div className="front-file absolute inset-[3.75%_11%_8.28%_5%] overflow-hidden rounded-lg border-[1.5px] border-black/8 bg-white dark:border-white/6 dark:bg-[#1a1d22]">
        {project.coverImage && (
          <img
            src={project.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {/* Cover — folder tab shape with backdrop-blur via Figma foreignObject pattern */}
      <svg
        className="pointer-events-none absolute left-0 top-0 overflow-visible"
        width="156"
        height="240"
        viewBox="0 0 156 240"
        fill="none"
      >
        <defs>
          <clipPath id={clipId} transform="translate(90 90)">
            <path d={COVER_PATH} />
          </clipPath>
        </defs>
        <foreignObject x="-90" y="-90" width="336" height="420">
          <div
            className="h-full w-full bg-black/[0.04] backdrop-blur-[8px] dark:bg-white/[0.06] dark:backdrop-blur-[45px]"
            style={{ clipPath: `url(#${clipId})` }}
          />
        </foreignObject>
        <path
          d={COVER_STROKE}
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-black/6 dark:text-white/6"
        />
      </svg>
      {/* Project name */}
      <p className="absolute left-3 top-4 w-[110px] text-[13px] font-medium leading-5 text-foreground">
        {project.name}
      </p>
      {/* Last updated */}
      <div className="absolute bottom-3 left-3 text-[10px] leading-4 text-muted-foreground">
        <p>Last updated</p>
        <p>{project.updatedAt}</p>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("updated");

  const filterLabels: Record<FilterType, string> = {
    all: "个人 / 团队筛选",
    personal: "个人项目",
    team: "团队项目",
  };

  const sortLabels: Record<SortType, string> = {
    updated: "排序方式",
    name: "按名称",
    created: "按创建时间",
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header — consistent with connections/skills */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <FolderSimple size={20} weight="regular" />
        <h1 className="flex-1 text-base font-semibold">Projects</h1>
        <Button
          variant="default"
          size="sm"
          className="-my-1 h-8 bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus size={14} weight="bold" />
          新建项目
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-10">
        <div className="flex w-full flex-col">
          {/* Section header */}
          <div className="flex h-12 items-center justify-between">
            <h2 className="text-base font-medium text-foreground">全部项目</h2>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-6 items-center gap-1 rounded border border-border px-2 text-xs text-foreground/80 transition-colors hover:bg-accent"
                  >
                    {filterLabels[filter]}
                    <CaretDown size={12} weight="regular" className="text-foreground/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilter("all")}>
                    个人 / 团队筛选
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("personal")}>
                    个人项目
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("team")}>
                    团队项目
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-6 items-center gap-1 rounded border border-border px-2 text-xs text-foreground/80 transition-colors hover:bg-accent"
                  >
                    {sortLabels[sort]}
                    <CaretDown size={12} weight="regular" className="text-foreground/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSort("updated")}>
                    排序方式
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort("name")}>
                    按名称
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSort("created")}>
                    按创建时间
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Project grid */}
          <div className="flex flex-wrap gap-10 py-10">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
