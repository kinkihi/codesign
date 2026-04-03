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
} from "@phosphor-icons/react";
import {
  ChatInput,
  type MentionItem,
  type CommandItem,
} from "@/components/chat-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mentions?: MentionItem[];
  command?: CommandItem;
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [chatTitle, setChatTitle] = React.useState("New chat");
  const [isRenaming, setIsRenaming] = React.useState(false);
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
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const renameInputRef = React.useRef<HTMLInputElement>(null);
  const initialQueryRef = React.useRef(searchParams.get("q"));

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  function handleSend(
    content: string,
    mentions: MentionItem[],
    command: CommandItem | null
  ) {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      mentions: mentions.length > 0 ? mentions : undefined,
      command: command || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

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

  return (
    <div className="flex h-full flex-col">
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
      <div className="flex items-center justify-center px-6 py-4">
        <ChatInput
          onSend={handleSend}
          isLoading={isThinking}
          onStop={() => setIsThinking(false)}
        />
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  copiedId,
  onCopy,
}: {
  message: Message;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
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
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary/70"
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
