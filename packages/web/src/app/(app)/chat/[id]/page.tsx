"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  Check,
  Sparkle,
  CaretDown,
  PencilSimple,
  FolderPlus,
  Trash,
  Lightbulb,
  X,
  UploadSimple,
  FolderSimple,
  ArrowLeft,
  ArrowsOut,
  ShareNetwork,
  ChatCircleDots,
  SidebarSimple,
  DownloadSimple,
} from "@phosphor-icons/react";
import {
  ChatInput,
  type MentionItem,
  type CommandItem,
  type SuggestionItem,
} from "@/components/chat-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MessageAction {
  id: string;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "bold" | "fill";
    className?: string;
  }>;
}

interface ResultCard {
  icon: React.ComponentType<{
    size?: number;
    weight?: "regular" | "bold" | "fill";
    className?: string;
  }>;
  title: string;
  description: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mentions?: MentionItem[];
  command?: CommandItem;
  actions?: MessageAction[];
  resultCard?: ResultCard;
}

function ResultDetailView({
  result,
  title,
  messages,
  onClose,
}: {
  result: ResultCard;
  title: string;
  messages: Message[];
  onClose: () => void;
}) {
  const [chatPanelOpen, setChatPanelOpen] = React.useState(false);
  const [panelVisible, setPanelVisible] = React.useState(false);
  const panelMessagesEndRef = React.useRef<HTMLDivElement>(null);
  const PANEL_WIDTH = 360;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col bg-background"
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.92, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.8 }}
    >
      {/* Sidebar toggle — topmost layer, always fixed position */}
      <button
        type="button"
        onClick={() => setChatPanelOpen((v) => !v)}
        className="absolute right-2 top-2 z-[60] flex size-6 items-center justify-center rounded text-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
        title="展开侧栏"
      >
        <SidebarSimple size={16} weight="regular" className="-scale-x-100" />
      </button>

      {/* Title bar */}
      <div className="relative z-30 flex h-10 shrink-0 items-center bg-background/80 px-2 backdrop-blur-xl">
        <div className="flex items-center">
          <button
            type="button"
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded text-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft size={16} weight="regular" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-0.5 rounded px-2 py-1 transition-colors hover:bg-accent"
              >
                <span className="max-w-[240px] truncate text-sm font-semibold text-foreground">
                  {result.title}
                </span>
                <CaretDown size={12} weight="regular" className="shrink-0 text-foreground/40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={4} className="w-44">
              <DropdownMenuItem>
                <PencilSimple weight="regular" className="size-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DownloadSimple weight="regular" className="size-4" />
                保存到本地
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FolderPlus weight="regular" className="size-4" />
                保存到项目
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <motion.div
          className="ml-auto flex items-center gap-1"
          animate={{ paddingRight: chatPanelOpen ? PANEL_WIDTH + 8 : 32 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <button
            type="button"
            className="flex h-6 items-center justify-center rounded border border-border px-2 text-xs text-foreground/80 transition-colors hover:bg-accent"
          >
            Edit
          </button>
          <button
            type="button"
            className="flex h-6 items-center justify-center rounded border border-border px-2 text-xs text-foreground/80 transition-colors hover:bg-accent"
          >
            Preview
          </button>
          <button
            type="button"
            className="flex h-6 items-center justify-center rounded bg-foreground px-2 text-xs text-background transition-colors hover:bg-foreground/90"
          >
            Share
          </button>
        </motion.div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Gradient fade below title bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-background via-background/60 to-transparent" />

        {/* Content — width adapts when sidebar opens */}
        <motion.div
          className="flex flex-1 flex-col overflow-y-auto px-4 py-6"
          animate={{ marginRight: chatPanelOpen ? PANEL_WIDTH : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="w-full">
            <motion.div
              className="overflow-hidden rounded-none border border-border bg-card h-[1123px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="p-8">
                <div className="mb-8 h-14 w-40 rounded-lg bg-secondary" />
                <div className="mb-6 h-72 w-full max-w-[520px] rounded-lg bg-secondary" />
                <div className="mb-6 h-6 w-full max-w-[520px] rounded-lg bg-secondary" />
                <div className="h-72 w-56 rounded-lg bg-secondary" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right sidebar — always mounted, animated via x + visibility, full window height */}
      <motion.div
        initial={false}
        animate={{ x: chatPanelOpen ? 0 : PANEL_WIDTH }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onAnimationStart={() => {
          if (chatPanelOpen) setPanelVisible(true);
        }}
        onAnimationComplete={() => {
          if (!chatPanelOpen) setPanelVisible(false);
        }}
        className="absolute bottom-0 right-0 top-0 z-40 flex w-[360px] flex-col border-l border-border bg-[var(--ai-foreground)]"
        style={{
          pointerEvents: chatPanelOpen ? "auto" : "none",
          visibility: panelVisible || chatPanelOpen ? "visible" : "hidden",
        }}
      >
        <div className="h-10 shrink-0" />

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <p className="pt-8 text-center text-xs text-foreground/30">
              暂无消息
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                      mass: 0.8,
                    }}
                    className="group flex flex-col gap-1"
                  >
                    {msg.role === "user" ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5">
                          <p className="whitespace-pre-wrap text-[13px] leading-6 text-foreground/90">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-col gap-2">
                          {msg.content.split("\n\n").map((para, i) => (
                            <p
                              key={i}
                              className="text-[13px] leading-6 text-foreground/80"
                            >
                              {para.split("\n").map((line, j) => (
                                <React.Fragment key={j}>
                                  {j > 0 && <br />}
                                  {renderInlineMarkdown(line)}
                                </React.Fragment>
                              ))}
                            </p>
                          ))}
                        </div>

                        {msg.resultCard && (
                          <div className="mt-2 flex flex-col gap-1.5">
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              生成结果
                            </span>
                            <div className="relative flex w-full flex-col items-start gap-2 overflow-hidden rounded-[10px] border border-border/60 bg-[var(--card)] p-3">
                              <div className="pointer-events-none absolute inset-0 rounded-[10px] bg-gradient-to-br from-foreground/[0.03] to-transparent" />
                              <div className="relative flex size-7 items-center justify-center rounded-md bg-secondary">
                                <msg.resultCard.icon
                                  size={14}
                                  weight="regular"
                                  className="text-foreground/60"
                                />
                              </div>
                              <div className="relative flex flex-col gap-1">
                                <span className="text-[13px] font-semibold text-foreground">
                                  {msg.resultCard.title}
                                </span>
                                <p className="text-[11px] leading-4 text-muted-foreground line-clamp-2">
                                  {msg.resultCard.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={panelMessagesEndRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 p-3">
          <ChatInput
            onSend={() => {}}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

const ACTION_MODES: Record<string, { icon: typeof Lightbulb; label: string; bg: string }> = {
  planning: { icon: Lightbulb, label: "策划", bg: "rgba(74,222,128,0.20)" },
};

const PLANNING_SUGGESTIONS: SuggestionItem[] = [
  { label: "投标汇报", text: "整合项目资料，生成一份结构清晰的投标汇报展示页，包含项目概况、设计理念、效果展示和技术指标" },
  { label: "前期分析", text: "基于场地资料与调研数据，生成前期分析文本页面，涵盖区位分析、现状解读、SWOT 和设计策略" },
  { label: "植物配植", text: "根据项目场地条件和设计风格，生成植物配植推荐方案页面，含植物选型、空间层次和季相搭配" },
  { label: "软装方案", text: "参考项目风格定位，生成室内软装设计方案页面，包含材质选板、家具配置和氛围意向" },
  { label: "规划研判", text: "梳理用地条件与规划指标，生成规划设计研判页面，含用地分析、功能布局和开发强度测算" },
];

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [chatTitle, setChatTitle] = React.useState("New chat");
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [activeMode, setActiveMode] = React.useState<string | null>(
    searchParams.get("action"),
  );
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "你好！我是 CoDesign AI 助手。我可以帮你进行项目策划、素材推荐、方案生成、自动摆放等工作。\n\n你可以输入 **@** 来引用项目资源，或输入 **/** 来使用快捷指令。请问有什么可以帮到你的？",
    },
  ]);
  const [isThinking, setIsThinking] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [actionHint, setActionHint] = React.useState<string | undefined>();
  const [viewingResult, setViewingResult] = React.useState<ResultCard | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const renameInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const initialQueryRef = React.useRef(searchParams.get("q"));

  const modeConfig = activeMode ? ACTION_MODES[activeMode] : null;
  const modeBadge = modeConfig ? (
    <ChatModeBadge
      icon={modeConfig.icon}
      bg={modeConfig.bg}
      onClose={() => setActiveMode(null)}
    />
  ) : undefined;

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  function handleSend(
    content: string,
    mentions: MentionItem[],
    command: CommandItem | null,
    meta?: { project?: string | null }
  ) {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      mentions: mentions.length > 0 ? mentions : undefined,
      command: command || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

    const hasAttachments = mentions.length > 0;
    const hasProject = !!meta?.project;
    const hasUrl = /https?:\/\/[^\s]+/.test(content);

    if (activeMode === "planning" && !hasAttachments && !hasProject && !hasUrl) {
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "好的，我需要更多的信息，你可以文字描述、粘贴链接或选择添加以下任意内容，让我后续生成方案和建议更贴合你的需求。",
          actions: [
            { id: "addFile", label: "添加文件", icon: UploadSimple },
            { id: "selectProject", label: "指定项目", icon: FolderSimple },
          ],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 800);
      return;
    }

    if (activeMode === "planning" && hasAttachments) {
      const topic = content || "项目策划汇报";
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "好的，已根据你提供的资料生成以下方案，点击查看详情。",
          resultCard: {
            icon: Lightbulb,
            title: `${topic.length > 20 ? topic.slice(0, 20) + "..." : topic} 项目策划汇报`,
            description:
              "基于项目资料与设计风格的综合分析，打造开放、灵活、生态的设计方案。涵盖项目概况、设计理念、效果展示和技术指标。",
          },
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 800);
      return;
    }

    const responseContent = generateMockResponse(content, mentions, command);

    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 800);
  }

  // Process initial message passed from homepage via ?q= param
  React.useEffect(() => {
    if (initialQueryRef.current) {
      const q = initialQueryRef.current;
      initialQueryRef.current = null;
      handleSend(q, [], null);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCopy(messageId: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleMessageAction(actionId: string) {
    if (actionId === "addFile") {
      setActionHint("点击 + 添加文件");
    } else if (actionId === "selectProject") {
      setActionHint("点击 + 指定项目");
    }
    inputRef.current?.focus();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => setActionHint(undefined), 4000);
  }

  return (
    <div className="relative flex h-full flex-col">
      {/* Result detail overlay */}
      <AnimatePresence>
        {viewingResult && (
          <ResultDetailView
            result={viewingResult}
            title={chatTitle}
            messages={messages}
            onClose={() => setViewingResult(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex h-[52px] shrink-0 items-center px-4">
        <ChatTitleBar
          title={chatTitle}
          isRenaming={isRenaming}
          inputRef={renameInputRef}
          onStartRename={() => {
            setIsRenaming(true);
            setTimeout(() => renameInputRef.current?.select(), 0);
          }}
          onFinishRename={(newTitle) => {
            if (newTitle.trim()) setChatTitle(newTitle.trim());
            setIsRenaming(false);
          }}
          onDelete={() => {}}
        />
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-[800px] flex-1 flex-col gap-6">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                  mass: 0.8,
                }}
                className="group flex flex-col gap-1"
              >
                {message.role === "assistant" ? (
                  <AssistantMessage
                    message={message}
                    copiedId={copiedId}
                    onCopy={handleCopy}
                    onAction={handleMessageAction}
                    onViewResult={setViewingResult}
                  />
                ) : (
                  <UserMessage message={message} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator */}
          <AnimatePresence>
            {isThinking && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              >
                <ThinkingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex shrink-0 items-center justify-center px-6 py-4">
        <ChatInput
          ref={inputRef}
          onSend={handleSend}
          isLoading={isThinking}
          onStop={() => setIsThinking(false)}
          modeBadge={modeBadge}
          hint={actionHint}
          onActivateMode={(mode) => setActiveMode(mode)}
          suggestions={activeMode === "planning" ? PLANNING_SUGGESTIONS : undefined}
          className="max-w-[800px]"
        />
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  copiedId,
  onCopy,
  onAction,
  onViewResult,
}: {
  message: Message;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
  onAction?: (actionId: string) => void;
  onViewResult?: (card: ResultCard) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col gap-2">
        {message.content.split("\n\n").map((paragraph, i) => (
          <p key={i} className="text-[13px] leading-6 text-foreground/80">
            {paragraph.split("\n").map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                {renderInlineMarkdown(line)}
              </React.Fragment>
            ))}
          </p>
        ))}
      </div>

      {message.actions && message.actions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {message.actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction?.(action.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-medium text-foreground/70 transition-all hover:bg-accent hover:text-foreground active:scale-[0.97]"
            >
              <action.icon size={14} weight="regular" />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {message.resultCard && (
        <div className="mt-3 flex flex-col gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            生成结果
          </span>
          <div className="group/card">
            <button
              type="button"
              onClick={() => onViewResult?.(message.resultCard!)}
              className="relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-[12px] border border-border/60 bg-[var(--card)] p-4 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-lg active:scale-[0.98]"
            >
              <div className="pointer-events-none absolute inset-0 rounded-[12px] bg-gradient-to-br from-foreground/[0.03] to-transparent" />
              <div className="relative flex size-9 items-center justify-center rounded-lg bg-secondary">
                <message.resultCard.icon
                  size={18}
                  weight="regular"
                  className="text-foreground/60"
                />
              </div>
              <div className="relative flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  {message.resultCard.title}
                </span>
                <p className="text-[13px] leading-5 text-muted-foreground">
                  {message.resultCard.description}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onCopy(message.id, message.content)}
          className={cn(
            "flex size-6 items-center justify-center rounded-md transition-colors",
            copiedId === message.id
              ? "text-foreground/50"
              : "text-foreground/25 hover:bg-accent hover:text-foreground/50"
          )}
          title="复制"
        >
          {copiedId === message.id ? (
            <Check size={13} weight="bold" />
          ) : (
            <Copy size={13} weight="regular" />
          )}
        </button>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      {(message.mentions?.length || message.command) && (
        <div className="flex flex-wrap items-center justify-end gap-1 pr-1">
          {message.command && (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <message.command.icon size={10} weight="regular" />
              {message.command.label}
            </span>
          )}
          {message.mentions?.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <m.icon size={10} weight="regular" />
              {m.label}
            </span>
          ))}
        </div>
      )}
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5">
        <p className="whitespace-pre-wrap text-[13px] leading-6 text-foreground/90">
          {message.content}
        </p>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <Sparkle
        size={14}
        weight="fill"
        className="text-muted-foreground/50"
        style={{ animation: "sparkle-spin 1.5s ease-in-out infinite" }}
      />
      <span
        className="text-[13px] font-medium"
        style={{
          background:
            "linear-gradient(90deg, var(--muted-foreground) 0%, var(--foreground) 50%, var(--muted-foreground) 100%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "thinking-shimmer 1.5s ease-in-out infinite",
          opacity: 0.45,
        }}
      >
        思考中
      </span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1 rounded-full bg-muted-foreground/40"
            style={{
              animation: `thinking-dot 1.2s ease-in-out infinite`,
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function generateMockResponse(
  content: string,
  mentions: MentionItem[],
  command: CommandItem | null
): string {
  if (command) {
    const responses: Record<string, string> = {
      planning: `好的，我来帮你进行项目策划。基于你的需求"${content || "新项目"}"，我建议从以下几个方面展开：\n\n1. **需求分析** — 明确项目目标和约束条件\n2. **场地调研** — 收集现场数据和环境信息\n3. **概念设计** — 提出初步设计方案\n4. **方案深化** — 细化设计并进行可行性验证`,
      "material-rec": `根据你的描述"${content || "项目需求"}"，我推荐以下素材：\n\n1. **天然石材** — 大理石/花岗岩面板，适合外立面\n2. **木饰面** — 胡桃木纹理，增添温暖质感\n3. **金属材质** — 拉丝不锈钢，现代感强\n4. **玻璃** — Low-E 中空玻璃，兼顾采光与隔热`,
      "design-gen": `正在为你生成设计方案...\n\n基于"${content || "设计需求"}"，方案构思如下：\n\n整体采用 **现代简约风格**，注重空间流动性和自然光的引入。功能分区清晰，动静分离，兼顾美观与实用性。`,
      "auto-place": `收到！我将根据"${content || "空间需求"}"进行智能布局摆放。\n\n分析空间尺寸和功能需求后，建议采用 **开放式布局**，主要家具沿墙摆放，中心区域保持通透。`,
      compliance: `正在进行规范检查...\n\n针对"${content || "当前方案"}"，检查结果如下：\n\n- ✅ 防火间距符合要求\n- ✅ 疏散通道宽度达标\n- ⚠️ 建议复核无障碍设施配置\n- ✅ 日照分析满足规范要求`,
      render: `开始生成渲染预览...\n\n基于当前方案"${content || "渲染场景"}"，渲染参数：\n- **光照**: 自然光 + 人工照明混合\n- **材质**: 高精度 PBR 材质\n- **分辨率**: 4K\n\n预计渲染时间约 2-3 分钟。`,
    };
    return (
      responses[command.id] || `已收到你的指令，正在处理"${content}"...`
    );
  }

  if (mentions.length > 0) {
    const mentionNames = mentions.map((m) => m.label).join("、");
    return `好的，我已经注意到你引用了 **${mentionNames}**。${content ? `关于"${content}"，` : ""}让我来分析这些资源并给出建议。\n\n正在加载引用内容...`;
  }

  return `收到你的消息。${content.length > 10 ? "这是一个很好的问题，" : ""}让我来帮你处理。\n\n你可以使用 **@** 来引用相关资源，或使用 **/** 选择特定指令来获得更精准的帮助。`;
}

/* ------------------------------------------------------------------ */
/*  Chat Title Bar                                                      */
/* ------------------------------------------------------------------ */

function ChatTitleBar({
  title,
  isRenaming,
  inputRef,
  onStartRename,
  onFinishRename,
  onDelete,
}: {
  title: string;
  isRenaming: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onStartRename: () => void;
  onFinishRename: (newTitle: string) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = React.useState(title);

  React.useEffect(() => {
    setDraft(title);
  }, [title]);

  function commitRename() {
    onFinishRename(draft);
  }

  if (isRenaming) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitRename}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitRename();
          if (e.key === "Escape") {
            setDraft(title);
            onFinishRename(title);
          }
        }}
        className="h-7 w-56 rounded-md border border-border bg-transparent px-2 text-sm font-medium text-foreground outline-none focus:border-foreground/20"
      />
    );
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={onStartRename}
        className="max-w-[240px] truncate rounded-md px-2 py-1 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
      >
        {title}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-foreground/40 transition-colors hover:bg-accent hover:text-foreground/60"
          >
            <CaretDown size={14} weight="regular" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4} className="w-44">
          <DropdownMenuItem onClick={onStartRename}>
            <PencilSimple weight="regular" className="size-4" />
            重命名
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FolderPlus weight="regular" className="size-4" />
            添加到项目
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-400 focus:text-red-400"
          >
            <Trash weight="regular" className="size-4" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ChatModeBadge({
  icon: Icon,
  bg,
  onClose,
}: {
  icon: React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string }>;
  bg: string;
  onClose: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <motion.button
      type="button"
      onClick={onClose}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="inline-flex h-6 items-center justify-center gap-0.5 rounded p-1 text-foreground backdrop-blur-[50px]"
      style={{ backgroundColor: bg }}
    >
      <span className="flex size-4 items-center justify-center">
        <Icon size={14} weight="regular" />
      </span>
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 16, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex size-4 items-center justify-center overflow-hidden rounded-full bg-foreground/[0.03]"
          >
            <X size={10} weight="bold" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
