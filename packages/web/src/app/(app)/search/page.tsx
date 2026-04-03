"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";

export default function SearchPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <MagnifyingGlass size={20} weight="regular" />
        <h1 className="text-base font-semibold">Search</h1>
      </div>
      <div className="p-6">
        <div className="relative max-w-xl">
          <MagnifyingGlass
            size={16}
            weight="regular"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="搜索对话、项目、资料..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/20 focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6">
        <p className="text-sm text-muted-foreground">输入关键词开始搜索</p>
      </div>
    </div>
  );
}
