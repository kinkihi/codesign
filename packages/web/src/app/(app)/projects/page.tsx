"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderSimple, Plus, CaretDown, DotsThreeVertical, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  coverColor: string;
  coverImage?: string;
}

const defaultProjects: Project[] = [
  {
    id: "1",
    name: "Project name",
    description: "项目描述",
    updatedAt: "Jan 26, 2026",
    coverColor: "from-rose-300/60 via-orange-200/40 to-transparent",
    coverImage: "/project-cover-1.png",
  },
  {
    id: "2",
    name: "Design Sprint",
    description: "项目描述",
    updatedAt: "Feb 12, 2026",
    coverColor: "from-slate-200/60 via-slate-100/40 to-transparent",
  },
  {
    id: "3",
    name: "User Research",
    description: "项目描述",
    updatedAt: "Mar 3, 2026",
    coverColor: "from-sky-200/60 via-sky-100/40 to-transparent",
  },
  {
    id: "4",
    name: "Prototype Testing",
    description: "项目描述",
    updatedAt: "Apr 15, 2026",
    coverColor: "from-emerald-200/60 via-emerald-100/40 to-transparent",
  },
];

const COVER_CLIP_NORMALIZED =
  "M0 0.0625C0 0.028 0.0431 0 0.0963 0H0.9037C0.9569 0 1 0.028 1 0.0625V0.2142C1 0.2241 0.9963 0.2339 0.9893 0.2428L0.9181 0.3324C0.9111 0.3413 0.9075 0.3511 0.9075 0.361V0.9375C0.9075 0.972 0.8644 1 0.8112 1H0.0963C0.0431 1 0 0.972 0 0.9375V0.0625Z";

const COVER_STROKE =
  "M15 0.75H140.7C148.57 0.75 154.95 7.13 154.95 15V51.403C154.95 53.672 154.408 55.909 153.369 57.926L142.297 79.433C141.149 81.662 140.55 84.135 140.55 86.642V225C140.55 232.87 134.17 239.25 126.3 239.25H15C7.13 239.25 0.75 232.87 0.75 225V15C0.75 7.13 7.13 0.75 15 0.75Z";

const coverClipStyle = {
  clipPath: "url(#folder-cover-clip)",
  WebkitClipPath: "url(#folder-cover-clip)",
} as const;

type FilterType = "all" | "personal" | "team";
type SortType = "updated" | "name" | "created";
type ViewMode = "list" | "grid";

function ListIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={active ? "opacity-100" : "opacity-60"}
    >
      <path
        d="M2.5 4H13.5M2.5 8H13.5M2.5 12H13.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={active ? "opacity-100" : "opacity-60"}
    >
      <rect x="2" y="2" width="5" height="5" rx="0.5" stroke="currentColor" />
      <rect x="9" y="2" width="5" height="5" rx="0.5" stroke="currentColor" />
      <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="currentColor" />
      <rect x="9" y="9" width="5" height="5" rx="0.5" stroke="currentColor" />
    </svg>
  );
}

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded bg-secondary/60 p-0.5">
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`flex size-6 items-center justify-center rounded-sm transition-colors ${
          mode === "list" ? "bg-background shadow-sm" : ""
        }`}
      >
        <ListIcon active={mode === "list"} />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`flex size-6 items-center justify-center rounded-sm transition-colors ${
          mode === "grid" ? "bg-background shadow-sm" : ""
        }`}
      >
        <GridIcon active={mode === "grid"} />
      </button>
    </div>
  );
}

function MiniFolder({ project }: { project: Project }) {
  return (
    <div className="relative h-16 w-12 shrink-0">
      <div className="pointer-events-none absolute inset-0 rounded-[3.75px] border border-border/60 bg-muted/40 dark:bg-[#1a1d22]" />
      <div className="absolute inset-[6%_8%] rounded border border-black/8 bg-white dark:border-white/6 dark:bg-[#1a1d22]" />
      <div className="absolute inset-[3.75%_11%_8.28%_5%] overflow-hidden rounded border border-black/8 bg-white dark:border-white/6 dark:bg-[#1a1d22]">
        {project.coverImage && (
          <img
            src={project.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3.75px]">
        <div
          className="absolute left-0 top-0 h-full w-[87.5%] bg-black/[0.04] backdrop-blur-[8px] dark:bg-white/[0.06] dark:backdrop-blur-[45px]"
          style={coverClipStyle}
        />
        <svg
          className="absolute left-0 top-0"
          width="42"
          height="64"
          viewBox="0 0 156 240"
          fill="none"
        >
          <path
            d={COVER_STROKE}
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-black/6 dark:text-white/6"
          />
        </svg>
      </div>
    </div>
  );
}

function ProjectListRow({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex items-center border-b border-border transition-colors hover:bg-accent/30"
    >
      <div className="flex flex-1 items-center gap-4 p-4">
        <MiniFolder project={project} />
        <div className="flex flex-col justify-between gap-1">
          <div>
            <p className="text-[13px] font-medium leading-5 text-foreground">
              {project.name}
            </p>
            <p className="text-[13px] leading-5 text-muted-foreground">
              {project.description}
            </p>
          </div>
          <p className="text-[11px] leading-4 text-foreground/40">
            Last updated {project.updatedAt}
          </p>
        </div>
      </div>
      <div className="flex items-center px-4">
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <DotsThreeVertical size={16} weight="bold" />
        </button>
      </div>
    </Link>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`} className="project-card relative aspect-[3/4] w-full cursor-pointer block">
      <div className="pointer-events-none absolute inset-0 rounded-[8%] border-[1.5px] border-border/60 bg-muted/40 dark:bg-[#1a1d22]" />
      <div className="absolute inset-[6%_8%] rounded-[4.5%] border-[1.5px] border-black/8 bg-white dark:border-white/6 dark:bg-[#1a1d22]" />
      <div className="front-file absolute inset-[3.75%_11%_8.28%_5%] overflow-hidden rounded-[4.5%] border-[1.5px] border-black/8 bg-white dark:border-white/6 dark:bg-[#1a1d22]">
        {project.coverImage && (
          <img
            src={project.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[8%]">
        <div
          className="absolute left-0 top-0 h-full w-[86.67%] bg-black/[0.04] backdrop-blur-[8px] dark:bg-white/[0.06] dark:backdrop-blur-[45px]"
          style={coverClipStyle}
        />
        <svg
          className="absolute left-0 top-0 h-full w-[86.67%]"
          viewBox="0 0 156 240"
          fill="none"
        >
          <path
            d={COVER_STROKE}
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-black/6 dark:text-white/6"
          />
        </svg>
      </div>
      <p className="absolute left-[7%] top-[7%] w-[60%] text-[11px] font-medium leading-4 text-foreground">
        {project.name}
      </p>
      <div className="absolute bottom-[5%] left-[7%] text-[8px] leading-3 text-muted-foreground">
        <p>Last updated</p>
        <p>{project.updatedAt}</p>
      </div>
    </Link>
  );
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ProjectsPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [projectList, setProjectList] = useState<Project[]>(defaultProjects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

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

  function handleCreate() {
    if (!newName.trim()) return;
    const now = new Date();
    const newProject: Project = {
      id: String(Date.now()),
      name: newName.trim(),
      description: newDesc.trim() || "项目描述",
      updatedAt: `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
      coverColor: "from-slate-200/60 via-slate-100/40 to-transparent",
    };
    setProjectList((prev) => [newProject, ...prev]);
    setNewName("");
    setNewDesc("");
    setDialogOpen(false);
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setNewName("");
      setNewDesc("");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <svg className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <defs>
          <clipPath id="folder-cover-clip" clipPathUnits="objectBoundingBox">
            <path d={COVER_CLIP_NORMALIZED} />
          </clipPath>
        </defs>
      </svg>
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <FolderSimple size={20} weight="regular" />
        <h1 className="flex-1 text-base font-semibold">Projects</h1>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="-my-1 h-8 bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus size={14} weight="bold" />
              新建项目
            </Button>
          </DialogTrigger>
          <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-[480px]">
            <div className="flex h-10 items-center justify-between border-b border-border px-1">
              <div className="flex items-center">
                <div className="p-2">
                  <FolderSimple size={16} />
                </div>
                <DialogTitle className="text-xs font-medium leading-none">
                  创建项目
                </DialogTitle>
              </div>
              <DialogClose className="mx-0.5 flex size-6 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <X size={16} />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>

            <div className="flex flex-col gap-4 p-6">
              <div className="flex flex-col gap-2">
                <Label>项目名称</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="输入项目名字"
                  className="h-8 rounded-md"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>项目介绍</Label>
                <Textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="关于项目"
                  className="min-h-16 resize-none rounded-md"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  取消
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto p-10">
        <div className="flex w-full flex-col">
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

              <ViewToggle mode={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 py-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 xl:gap-5">
              {projectList.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center border-b border-border">
                <p className="flex-1 p-4 text-[13px] font-semibold text-foreground/80">
                  Name
                </p>
                <p className="w-[90px] p-4 text-[13px] font-semibold text-foreground/80">
                  Option
                </p>
              </div>
              {projectList.map((project) => (
                <ProjectListRow key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
