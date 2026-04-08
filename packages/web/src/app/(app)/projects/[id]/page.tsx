"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  DotsThreeVertical,
  FileDoc,
  FileHtml,
  FilePpt,
  FileXls,
  FilePng,
  FileJpg,
  File,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Resource {
  id: string;
  name: string;
  type: "doc" | "html" | "pptx" | "xlsx" | "png" | "jpg" | "other";
}

const FILE_ICONS: Record<Resource["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  doc: FileDoc,
  html: FileHtml,
  pptx: FilePpt,
  xlsx: FileXls,
  png: FilePng,
  jpg: FileJpg,
  other: File,
};

function getFileType(filename: string): Resource["type"] {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "doc":
    case "docx":
      return "doc";
    case "html":
    case "htm":
      return "html";
    case "ppt":
    case "pptx":
      return "pptx";
    case "xls":
    case "xlsx":
      return "xlsx";
    case "png":
      return "png";
    case "jpg":
    case "jpeg":
      return "jpg";
    default:
      return "other";
  }
}

const defaultResources: Resource[] = [
  { id: "1", name: "file name.doc", type: "doc" },
  { id: "2", name: "concept name.html", type: "html" },
  { id: "3", name: "presentation.pptx", type: "pptx" },
  { id: "4", name: "spreadsheet.xlsx", type: "xlsx" },
  { id: "5", name: "image.png", type: "png" },
  ...Array.from({ length: 14 }, (_, i) => ({
    id: String(6 + i),
    name: `ai_draft_${i + 1}.jpg`,
    type: "jpg" as const,
  })),
];

const projectNames: Record<string, string> = {
  "1": "Project name",
  "2": "Design Sprint",
  "3": "User Research",
  "4": "Prototype Testing",
};

function ResourceRow({ resource }: { resource: Resource }) {
  const Icon = FILE_ICONS[resource.type];

  return (
    <div className="flex items-center border-b border-border transition-colors hover:bg-accent/30">
      <div className="flex flex-1 items-center gap-2 p-4">
        <Icon size={24} className="shrink-0 text-foreground/60" />
        <p className="text-[13px] font-medium leading-5 text-foreground">
          {resource.name}
        </p>
      </div>
      <div className="flex w-[90px] items-center justify-center px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <DotsThreeVertical size={16} weight="bold" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>打开</DropdownMenuItem>
            <DropdownMenuItem>下载</DropdownMenuItem>
            <DropdownMenuItem>重命名</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const projectName = projectNames[id] || "Selected project name";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => router.push("/projects")}
            className="flex size-6 items-center justify-center rounded text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="px-1 text-[13px] font-semibold text-foreground">
            {projectName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 rounded px-2 text-xs"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 rounded px-2 text-xs"
          >
            Setting
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-10 pt-2">
        <div className="py-2">
          <p className="text-xs font-semibold text-foreground/60">Resources</p>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center border-b border-border">
            <p className="flex-1 p-4 text-[13px] font-semibold text-foreground/80">
              Name
            </p>
            <p className="w-[90px] p-4 text-center text-[13px] font-semibold text-foreground/80">
              Option
            </p>
          </div>
          {defaultResources.map((resource) => (
            <ResourceRow key={resource.id} resource={resource} />
          ))}
        </div>
      </div>
    </div>
  );
}
