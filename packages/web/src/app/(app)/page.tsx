"use client";

import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/chat-input";
import { QuickActions } from "@/components/quick-actions";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <div className="flex flex-col items-center gap-2 py-4">
          <h1 className="text-2xl font-medium text-foreground">开始对话设计</h1>
          <p className="text-[13px] leading-5 text-muted-foreground">
            建筑·景观·规划·室内
          </p>
        </div>
        <QuickActions />
      </div>

      <div className="flex items-center justify-center px-6 py-6">
        <ChatInput
          onSend={(message) => {
            const chatId = Date.now().toString(36);
            router.push(`/chat/${chatId}?q=${encodeURIComponent(message)}`);
          }}
        />
      </div>
    </div>
  );
}
