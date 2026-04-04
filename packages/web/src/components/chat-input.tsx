"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowUp,
  Plus,
  MagnifyingGlass,
  FolderSimple,
  Cube,
  Buildings,
  BookOpen,
  GlobeSimple,
  Lightbulb,
  Sparkle,
  PencilLine,
  GridFour,
  CheckCircle,
  Eye,
  X,
  ImageSquare,
  Stop,
  UploadSimple,
  PlugsConnected,
  CaretRight,
  CaretDown,
  Faders,
  ListBullets,
  FileText,
  Link as LinkIcon,
} from "@phosphor-icons/react";
import { CanvasIcon, SkillsIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HoverCard as HoverCardPrimitive } from "radix-ui";

interface MentionItem {
  id: string;
  icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "bold" | "fill";
    className?: string;
  }>;
  label: string;
  description: string;
  category: string;
}

interface CommandItem {
  id: string;
  icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "bold" | "fill";
    className?: string;
  }>;
  label: string;
  description: string;
}

export type { MentionItem, CommandItem };

const mentionItems: MentionItem[] = [
  {
    id: "project-files",
    icon: FolderSimple,
    label: "项目文件",
    description: "引用项目中的文件",
    category: "资源",
  },
  {
    id: "materials",
    icon: Cube,
    label: "素材库",
    description: "搜索素材资源",
    category: "资源",
  },
  {
    id: "bim",
    icon: Buildings,
    label: "BIM模型",
    description: "引用BIM模型数据",
    category: "资源",
  },
  {
    id: "image",
    icon: ImageSquare,
    label: "图片",
    description: "上传或引用图片",
    category: "资源",
  },
  {
    id: "standards",
    icon: BookOpen,
    label: "规范标准",
    description: "建筑规范与标准",
    category: "知识",
  },
  {
    id: "web",
    icon: GlobeSimple,
    label: "网页内容",
    description: "引用网页信息",
    category: "知识",
  },
];

const commandItems: CommandItem[] = [
  {
    id: "material-rec",
    icon: Sparkle,
    label: "素材推荐",
    description: "智能推荐相关素材",
  },
  {
    id: "design-gen",
    icon: PencilLine,
    label: "方案生成",
    description: "自动生成设计方案",
  },
  {
    id: "auto-place",
    icon: GridFour,
    label: "自动摆放",
    description: "智能摆放布局元素",
  },
  {
    id: "compliance",
    icon: CheckCircle,
    label: "规范检查",
    description: "检查是否符合规范",
  },
  {
    id: "render",
    icon: Eye,
    label: "渲染预览",
    description: "生成渲染效果图",
  },
];

interface SuggestionItem {
  label: string;
  text: string;
}

export type { SuggestionItem };

interface ChatInputProps {
  onSend?: (
    message: string,
    mentions: MentionItem[],
    command: CommandItem | null,
    meta?: { project?: string | null }
  ) => void;
  isLoading?: boolean;
  onStop?: () => void;
  className?: string;
  modeBadge?: React.ReactNode;
  hint?: string;
  compact?: boolean;
  onExpand?: () => void;
  onActivateMode?: (mode: string) => void;
  suggestions?: SuggestionItem[];
}

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput({
    onSend,
    isLoading,
    onStop,
    className,
    modeBadge,
    hint,
    compact,
    onExpand,
    onActivateMode,
    suggestions,
  }, ref) {
  const [value, setValue] = React.useState("");
  const [selectedMentions, setSelectedMentions] = React.useState<
    MentionItem[]
  >([]);
  const [activeCommand, setActiveCommand] = React.useState<CommandItem | null>(
    null
  );
  const [popoverType, setPopoverType] = React.useState<
    "mention" | "command" | null
  >(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [mentionQuery, setMentionQuery] = React.useState("");
  const [commandQuery, setCommandQuery] = React.useState("");
  const [triggerPosition, setTriggerPosition] = React.useState<number | null>(
    null
  );
  const [showAurora, setShowAurora] = React.useState(false);
  const [d5Enabled, setD5Enabled] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<string | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());

  // Spring physics for input card
  const rawY = useMotionValue(0);
  const rawScale = useMotionValue(1);
  const y = useSpring(rawY, { stiffness: 500, damping: 28, mass: 0.8 });
  const scale = useSpring(rawScale, { stiffness: 500, damping: 25, mass: 0.6 });

  // Focus shadow (persistent while active)
  const focusRaw = useMotionValue(0);
  const focusSpring = useSpring(focusRaw, { stiffness: 200, damping: 25 });

  // Send glow pulse
  const glowRaw = useMotionValue(0);
  const glowSpring = useSpring(glowRaw, { stiffness: 300, damping: 20 });

  const boxShadow = useTransform(
    [focusSpring, glowSpring],
    (latest: number[]) => {
      const f = latest[0];
      const g = latest[1];
      return [
        `0 4px 24px 0 rgba(0, 0, 0, ${f * 0.08})`,
        `0 1px 8px 0 rgba(0, 0, 0, ${f * 0.04})`,
        `0 0 ${g * 20}px ${g * 5}px rgba(0, 0, 0, ${g * 0.06})`,
      ].join(", ");
    }
  );

  // Auto-focus when expanding from compact
  React.useEffect(() => {
    if (!compact) {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [compact]);

  // Auto-grow textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const filteredMentions = React.useMemo(() => {
    if (!mentionQuery) return mentionItems;
    const q = mentionQuery.toLowerCase();
    return mentionItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [mentionQuery]);

  const filteredCommands = React.useMemo(() => {
    if (!commandQuery) return commandItems;
    const q = commandQuery.toLowerCase();
    return commandItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  }, [commandQuery]);

  const currentItems =
    popoverType === "mention" ? filteredMentions : filteredCommands;

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [mentionQuery, commandQuery, popoverType]);

  React.useEffect(() => {
    const el = itemRefs.current.get(highlightedIndex);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  React.useEffect(() => {
    if (!popoverType) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        closePopover();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverType]);

  function closePopover() {
    setPopoverType(null);
    setMentionQuery("");
    setCommandQuery("");
    setHighlightedIndex(0);
    setTriggerPosition(null);
  }

  function removeTriggerText(query: string) {
    if (triggerPosition === null) return;
    const before = value.substring(0, triggerPosition);
    const after = value.substring(triggerPosition + 1 + query.length);
    setValue(before + after);
  }

  function handleMentionSelect(item: MentionItem) {
    removeTriggerText(mentionQuery);
    if (!selectedMentions.find((m) => m.id === item.id)) {
      setSelectedMentions((prev) => [...prev, item]);
    }
    closePopover();
    textareaRef.current?.focus();
  }

  function handleCommandSelect(item: CommandItem) {
    removeTriggerText(commandQuery);
    setActiveCommand(item);
    closePopover();
    textareaRef.current?.focus();
  }

  function removeMention(id: string) {
    setSelectedMentions((prev) => prev.filter((m) => m.id !== id));
  }

  function removeCommand() {
    setActiveCommand(null);
  }

  function detectTrigger(text: string, cursorPos: number) {
    const textBeforeCursor = text.substring(0, cursorPos);

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex >= 0) {
      const charBefore =
        lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : null;
      if (charBefore === null || /\s/.test(charBefore)) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        if (!/\s/.test(query)) {
          setPopoverType("mention");
          setMentionQuery(query);
          setTriggerPosition(lastAtIndex);
          return;
        }
      }
    }

    const lastSlashIndex = textBeforeCursor.lastIndexOf("/");
    if (lastSlashIndex >= 0) {
      const charBefore =
        lastSlashIndex > 0 ? textBeforeCursor[lastSlashIndex - 1] : null;
      if (charBefore === null || /\s/.test(charBefore)) {
        const query = textBeforeCursor.substring(lastSlashIndex + 1);
        if (!/\s/.test(query)) {
          setPopoverType("command");
          setCommandQuery(query);
          setTriggerPosition(lastSlashIndex);
          return;
        }
      }
    }

    if (popoverType) closePopover();
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    detectTrigger(newValue, e.target.selectionStart);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (popoverType && currentItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % currentItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + currentItems.length) % currentItems.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (popoverType === "mention") {
          handleMentionSelect(filteredMentions[highlightedIndex]);
        } else {
          handleCommandSelect(filteredCommands[highlightedIndex]);
        }
        return;
      }
    }

    if (e.key === "Escape" && popoverType) {
      e.preventDefault();
      closePopover();
      return;
    }

    if (e.key === "Enter" && !e.shiftKey && !popoverType) {
      e.preventDefault();
      handleSend();
    }
  }

  function triggerSendAnimation() {
    rawY.set(-6);
    rawScale.set(0.985);
    setTimeout(() => {
      rawY.set(0);
      rawScale.set(1);
    }, 120);

    glowRaw.set(1);
    setTimeout(() => glowRaw.set(0), 200);

    setShowAurora(true);
    setTimeout(() => setShowAurora(false), 800);
  }

  function handleFocus() {
    focusRaw.set(1);
  }

  function handleBlur() {
    focusRaw.set(0);
  }

  function handleSend() {
    if (!value.trim() && selectedMentions.length === 0 && !activeCommand)
      return;
    triggerSendAnimation();
    onSend?.(value.trim(), selectedMentions, activeCommand, { project: selectedProject });
    setValue("");
    setSelectedMentions([]);
    setActiveCommand(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  const hasContent =
    value.trim().length > 0 ||
    selectedMentions.length > 0 ||
    activeCommand !== null;

  const showMentionEmpty =
    popoverType === "mention" &&
    filteredMentions.length === 0 &&
    mentionQuery.length > 0;

  return (
    <div className={cn("relative w-full max-w-[480px]", className)}>
      {/* Popover */}
      {popoverType && (currentItems.length > 0 || showMentionEmpty) && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/20"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            {popoverType === "mention" ? (
              <>
                <MagnifyingGlass
                  size={14}
                  weight="regular"
                  className="shrink-0 text-muted-foreground"
                />
                <span className="text-xs text-muted-foreground">
                  {mentionQuery
                    ? `搜索: ${mentionQuery}`
                    : "输入关键词搜索，或选择引用类型"}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">选择指令</span>
            )}
          </div>

          <div className="max-h-[260px] overflow-y-auto py-1">
            {showMentionEmpty ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                未找到匹配的引用项
              </div>
            ) : (
              currentItems.map((item, index) => (
                <button
                  key={item.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(index, el);
                    else itemRefs.current.delete(index);
                  }}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                    index === highlightedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/80 hover:bg-accent/50"
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => {
                    if (popoverType === "mention") {
                      handleMentionSelect(item as MentionItem);
                    } else {
                      handleCommandSelect(item as CommandItem);
                    }
                  }}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <item.icon
                      size={16}
                      weight="regular"
                      className="text-foreground/60"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {popoverType === "mention" ? "@" : "/"}
                      {item.label}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                  {popoverType === "mention" && "category" in item && (
                    <span className="shrink-0 text-[10px] text-muted-foreground/60">
                      {(item as MentionItem).category}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border px-3 py-1.5">
            <span className="text-[11px] text-muted-foreground/60">
              ↑↓ 导航 · Enter 选择 · Esc 关闭
            </span>
          </div>
        </motion.div>
      )}

      {/* Aurora glow behind input */}
      {showAurora && (
        <div
          className="pointer-events-none absolute inset-x-8 -bottom-1 z-0 h-14"
          style={{ animation: "aurora-burst 0.8s ease-out forwards" }}
        >
          <div className="h-full w-full rounded-2xl bg-gradient-to-r from-[#ECECFA] via-[#FF7944] to-[#FFDD99] opacity-80 blur-2xl" />
        </div>
      )}

      {/* Suggestion pills — hidden when a command is active */}
      {!compact && !activeCommand && suggestions && suggestions.length > 0 && (
        <div className="relative z-10 mb-2 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setValue(item.text);
                textareaRef.current?.focus();
              }}
              className="shrink-0 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-accent hover:text-foreground dark:bg-white/10"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Command context bar */}
      {!compact && activeCommand && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="relative z-10 flex items-center justify-between rounded-t-2xl border border-b-0 border-input bg-secondary/80 px-3 py-2 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[13px] font-medium text-foreground/90">
              {activeCommand.label}
            </span>
            {activeCommand.id === "auto-place" ? (
              d5Enabled ? (
                <span className="truncate text-xs text-muted-foreground">
                  当前d5项目名.drs
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    未检测到D5 Render 程序
                  </span>
                  <button
                    type="button"
                    onClick={() => setD5Enabled(true)}
                    className="shrink-0 rounded-md bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                  >
                    链接
                  </button>
                </div>
              )
            ) : (
              <span className="truncate text-xs text-muted-foreground">
                {activeCommand.description}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={removeCommand}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-foreground/30 transition-colors hover:bg-foreground/5 hover:text-foreground/60"
          >
            <X size={14} weight="regular" />
          </button>
        </motion.div>
      )}

      {/* Input card with spring physics */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        style={compact ? undefined : { y, scale, boxShadow }}
        onClick={compact ? onExpand : undefined}
        className={cn(
          "relative z-10 border border-input bg-card transition-colors",
          compact
            ? "cursor-pointer rounded-lg hover:border-foreground/10"
            : activeCommand
              ? "rounded-b-2xl rounded-t-none focus-within:border-foreground/15"
              : "rounded-2xl focus-within:border-foreground/15"
        )}
      >
        {/* Inline attachments with hover previews */}
        {!compact && selectedMentions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 pt-3">
            {selectedMentions.map((mention) => (
              <HoverCardPrimitive.Root key={mention.id} openDelay={300} closeDelay={150}>
                <HoverCardPrimitive.Trigger asChild>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="group/badge relative inline-flex max-w-[120px] cursor-default items-center gap-1.5 rounded-md bg-secondary py-1 pl-2 pr-2 text-xs font-medium text-foreground/70 transition-colors hover:bg-accent"
                  >
                    <mention.icon size={12} weight="regular" className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{mention.label}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeMention(mention.id); }}
                      className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-foreground/10 opacity-0 backdrop-blur-md transition-opacity group-hover/badge:opacity-100 hover:bg-foreground/15"
                    >
                      <X size={8} weight="bold" className="text-foreground/50" />
                    </button>
                  </motion.span>
                </HoverCardPrimitive.Trigger>
                <HoverCardPrimitive.Portal>
                  <HoverCardPrimitive.Content
                    side="top"
                    align="center"
                    sideOffset={8}
                    className="z-50 w-72 rounded-xl border border-border bg-popover shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                  >
                    <MentionHoverContent mention={mention} />
                  </HoverCardPrimitive.Content>
                </HoverCardPrimitive.Portal>
              </HoverCardPrimitive.Root>
            ))}
          </div>
        )}

        {/* Textarea — hidden in compact mode */}
        {!compact && (
          <div className="px-4 py-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="输入消息...  @ 添加引用  / 使用指令"
              className="w-full resize-none bg-transparent text-[13px] leading-6 text-foreground placeholder:text-foreground/25 focus:outline-none"
              rows={1}
              style={{ minHeight: "24px", maxHeight: "200px" }}
            />
          </div>
        )}

        {/* Toolbar */}
        <div className={cn(
          "flex items-center justify-between",
          compact ? "p-2" : "px-2.5 pb-2.5"
        )}>
          <div className="flex items-center gap-1">
            {!compact && (
              <AttachMenu
                d5Enabled={d5Enabled}
                onD5EnabledChange={setD5Enabled}
                onProjectSelect={setSelectedProject}
                onActivateMode={onActivateMode}
              />
            )}
            {compact && (
              <div onClick={(e) => e.stopPropagation()}>
                <AttachMenu
                  d5Enabled={d5Enabled}
                  onD5EnabledChange={setD5Enabled}
                  onProjectSelect={setSelectedProject}
                  onActivateMode={onActivateMode}
                />
              </div>
            )}
            {modeBadge}
            {hint && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="truncate text-[12px] text-foreground/30"
              >
                {hint}
              </motion.span>
            )}
          </div>
          <div className="flex items-center">
            {isLoading ? (
              <motion.button
                type="button"
                onClick={(e) => { e.stopPropagation(); onStop?.(); }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background transition-colors hover:bg-foreground/80"
                title="停止生成"
              >
                <Stop size={14} weight="fill" />
              </motion.button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (compact) { onExpand?.(); return; }
                  handleSend();
                }}
                disabled={!compact && !hasContent}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-all duration-200",
                  compact
                    ? "bg-foreground/8 text-foreground/20"
                    : hasContent
                      ? "bg-foreground text-background hover:bg-foreground/80 active:scale-90"
                      : "bg-foreground/8 text-foreground/20"
                )}
                title="发送消息 (Enter)"
              >
                <ArrowUp size={16} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Status bar below input */}
      {!compact && (selectedProject || d5Enabled) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative z-10 mx-2 flex items-center justify-between rounded-b-xl bg-background/70 backdrop-blur-md px-2 py-2"
        >
          {/* Left: project badge */}
          <div className="flex items-center">
            {selectedProject && (
              <div className="inline-flex h-6 items-center">
                <HoverCardPrimitive.Root openDelay={300} closeDelay={200}>
                  <HoverCardPrimitive.Trigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-full items-center gap-1 rounded-l border border-border px-1.5 text-xs text-foreground/80 transition-colors hover:bg-accent"
                    >
                      <FolderSimple size={12} weight="regular" className="shrink-0" />
                      <span>{selectedProject}</span>
                    </button>
                  </HoverCardPrimitive.Trigger>
                  <HoverCardPrimitive.Portal>
                    <HoverCardPrimitive.Content
                      side="bottom"
                      align="start"
                      sideOffset={8}
                      className="z-50 w-64 rounded-xl border border-border bg-popover p-4 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                    >
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-foreground">{selectedProject}</p>
                        <p className="text-xs text-muted-foreground">description...</p>
                        <p className="text-xs text-muted-foreground/60">Last updated Jan 26, 2026</p>
                      </div>
                    </HoverCardPrimitive.Content>
                  </HoverCardPrimitive.Portal>
                </HoverCardPrimitive.Root>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-full items-center rounded-r border border-l-0 border-border px-1 text-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <CaretDown size={12} weight="regular" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="start" sideOffset={4} className="w-36">
                    <DropdownMenuItem>查看详情</DropdownMenuItem>
                    <DropdownMenuItem>本地打开</DropdownMenuItem>
                    <DropdownMenuItem>重命名</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setSelectedProject(null)}
                    >
                      移除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Right: connection status */}
          <div className="flex items-center">
            {d5Enabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setD5Enabled(false)}
                    className="group/conn inline-flex h-6 items-center gap-1 rounded px-1.5 text-xs text-foreground/80 transition-colors hover:bg-accent"
                  >
                    <span className="size-1.5 rounded-full bg-green-500" />
                    <span>连接中</span>
                    <span className="relative size-3 text-muted-foreground">
                      <CaretDown size={12} weight="regular" className="absolute inset-0 transition-all duration-200 group-hover/conn:scale-0 group-hover/conn:opacity-0" />
                      <X size={12} weight="regular" className="absolute inset-0 scale-0 opacity-0 transition-all duration-200 group-hover/conn:scale-100 group-hover/conn:opacity-100" />
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  与 D5 Render 正在连接
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Mention hover preview per type                                     */
/* ------------------------------------------------------------------ */

function MentionHoverContent({ mention }: { mention: MentionItem }) {
  switch (mention.id) {
    case "image":
      return (
        <div className="flex flex-col gap-3 p-3">
          <div className="overflow-hidden rounded-lg border border-border/40">
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80"
              alt="preview"
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-0.5 px-0.5">
            <p className="text-sm font-medium text-foreground">mountain-landscape.jpg</p>
            <p className="text-xs text-muted-foreground">image/jpeg</p>
          </div>
        </div>
      );

    case "project-files":
      return (
        <div className="flex flex-col gap-2.5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <FolderSimple size={18} weight="regular" className="text-foreground/50" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">项目文件</p>
              <p className="text-xs text-muted-foreground">3 个文件被引用</p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 p-2">
            {[
              { name: "总平面图.dwg", size: "2.4 MB" },
              { name: "效果图_v2.psd", size: "18.7 MB" },
              { name: "设计说明.pdf", size: "540 KB" },
            ].map((f) => (
              <div key={f.name} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-xs">
                <FileText size={13} weight="regular" className="shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-foreground/70">{f.name}</span>
                <span className="shrink-0 text-muted-foreground/50">{f.size}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "materials":
      return (
        <div className="flex flex-col gap-2.5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Cube size={18} weight="regular" className="text-foreground/50" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">素材库</p>
              <p className="text-xs text-muted-foreground">已关联项目素材资源</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {["from-amber-100 to-amber-200", "from-stone-200 to-stone-300", "from-slate-100 to-slate-200", "from-zinc-300 to-zinc-400"].map((g, i) => (
              <div key={i} className={cn("aspect-square rounded-lg bg-gradient-to-br", g)} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">可用素材: <span className="text-foreground/70">1,234 个</span></p>
        </div>
      );

    case "bim":
      return (
        <div className="flex flex-col gap-2.5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Buildings size={18} weight="regular" className="text-foreground/50" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">BIM 模型</p>
              <p className="text-xs text-muted-foreground">引用 BIM 模型数据</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-2.5 text-xs">
            {[
              ["文件格式", "Revit (.rvt)"],
              ["构件数量", "2,847 个"],
              ["文件大小", "156 MB"],
              ["最近更新", "2026-03-28"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-foreground/70">{v}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "standards":
      return (
        <div className="flex flex-col gap-2.5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <BookOpen size={18} weight="regular" className="text-foreground/50" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">规范标准</p>
              <p className="text-xs text-muted-foreground">建筑规范与标准引用</p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-muted/50 p-2">
            {[
              "GB 50016-2014 建筑设计防火规范",
              "GB 50352-2019 民用建筑设计统一标准",
              "GB 55037-2022 建筑防火通用规范",
            ].map((s) => (
              <div key={s} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-xs">
                <BookOpen size={12} weight="regular" className="shrink-0 text-muted-foreground" />
                <span className="truncate text-foreground/70">{s}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "web":
      return (
        <div className="flex flex-col gap-2.5 p-3">
          <div className="aspect-[2/1] w-full overflow-hidden rounded-lg bg-gradient-to-br from-muted to-secondary">
            <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground/40">
              <GlobeSimple size={24} weight="regular" />
              <span className="text-[10px]">网页预览</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">网页内容引用</p>
            <p className="text-xs leading-relaxed text-muted-foreground">引用网页中的文字、图片等内容作为设计参考</p>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
              <LinkIcon size={10} weight="regular" />
              <span className="truncate">https://example.com/reference</span>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-2.5 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <mention.icon size={18} weight="regular" className="text-foreground/50" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{mention.label}</p>
            <p className="text-xs text-muted-foreground">{mention.description}</p>
          </div>
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Attach / + menu                                                    */
/* ------------------------------------------------------------------ */

interface AttachMenuItem {
  icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "bold" | "fill";
    className?: string;
  }>;
  label: string;
  hasSubmenu?: boolean;
  href?: string;
  mode?: string;
}

const attachSections: { items: AttachMenuItem[]; key: string }[] = [
  {
    key: "files",
    items: [
      { icon: UploadSimple, label: "Add files" },
      { icon: Plus, label: "添加项目", hasSubmenu: true },
    ],
  },
  {
    key: "actions",
    items: [
      { icon: Lightbulb, label: "策划", href: "/chat/new?action=planning", mode: "planning" },
      { icon: CanvasIcon, label: "画布", href: "/canvas" },
    ],
  },
  {
    key: "tools",
    items: [
      { icon: PlugsConnected, label: "链接", hasSubmenu: true },
      { icon: SkillsIcon, label: "Skills", hasSubmenu: true },
    ],
  },
];

function AttachMenu({
  d5Enabled,
  onD5EnabledChange,
  onProjectSelect,
  onActivateMode,
}: {
  d5Enabled: boolean;
  onD5EnabledChange: (v: boolean) => void;
  onProjectSelect: (name: string) => void;
  onActivateMode?: (mode: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex size-8 items-center justify-center rounded-lg transition-all duration-200",
            open
              ? "bg-accent text-foreground/60 rotate-45"
              : "text-foreground/60 hover:bg-accent hover:text-foreground/80"
          )}
          title="添加"
        >
          <Plus size={16} weight="regular" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-52"
      >
        {attachSections.map((section, sectionIdx) => (
          <React.Fragment key={section.key}>
            {sectionIdx > 0 && <DropdownMenuSeparator />}
            {section.key === "files" ? (
              <>
                <DropdownMenuItem onClick={() => setOpen(false)}>
                  <UploadSimple size={16} weight="regular" className="shrink-0" />
                  <span className="flex-1">Add files</span>
                </DropdownMenuItem>

                {/* 添加项目 submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Plus size={16} weight="regular" className="shrink-0" />
                    <span className="flex-1">添加项目</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-52">
                      <DropdownMenuItem onClick={() => { onProjectSelect("Sample project 1"); setOpen(false); }}>
                        <FolderSimple size={16} weight="regular" className="shrink-0" />
                        <span className="flex-1">Sample project 1</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { onProjectSelect("Sample project 2"); setOpen(false); }}>
                        <FolderSimple size={16} weight="regular" className="shrink-0" />
                        <span className="flex-1">Sample project 2</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setOpen(false)}>
                        <Plus size={16} weight="regular" className="shrink-0" />
                        <span className="flex-1">New project</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </>
            ) : section.key === "tools" ? (
              <>
                {/* 链接 submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <PlugsConnected size={16} weight="regular" className="shrink-0" />
                    <span className="flex-1">链接</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-56">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onD5EnabledChange(!d5Enabled);
                        }}
                      >
                        <img src="/d5-render.png" alt="D5 Render" className="size-4 shrink-0 rounded" />
                        <span className="flex-1">D5 Render</span>
                        <button
                          type="button"
                          aria-label="Toggle D5 Render"
                          onClick={(e) => {
                            e.stopPropagation();
                            onD5EnabledChange(!d5Enabled);
                          }}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                            d5Enabled ? "bg-foreground" : "bg-muted-foreground/30"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform",
                              d5Enabled ? "translate-x-[18px]" : "translate-x-[3px]"
                            )}
                          />
                        </button>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setOpen(false)}>
                        <Faders size={16} weight="regular" className="shrink-0" />
                        <span className="flex-1">Manage</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Skills submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <SkillsIcon className="size-4 shrink-0" />
                    <span className="flex-1">Skills</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-52">
                      <DropdownMenuItem onClick={() => setOpen(false)}>
                        <ListBullets size={16} weight="regular" className="shrink-0" />
                        <span className="flex-1">Sample Skill</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setOpen(false)}>
                        <Faders size={16} weight="regular" className="shrink-0" />
                        <span className="flex-1">Manage</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </>
            ) : (
              section.items.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={() => {
                    setOpen(false);
                    if (item.mode && onActivateMode) {
                      onActivateMode(item.mode);
                    } else if (item.href) {
                      router.push(item.href);
                    }
                  }}
                >
                  <item.icon size={16} weight="regular" className="shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.hasSubmenu && (
                    <CaretRight size={12} weight="regular" className="ml-auto shrink-0 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
