"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChatCircle,
  MagnifyingGlass,
  FolderSimple,
  PlugsConnected,
  GearSix,
  Sun,
  Moon,
  GlobeSimple,
  Info,
  SignOut,
  Check,
} from "@phosphor-icons/react";
import { SkillsIcon } from "@/components/icons";
import { useAuth } from "@/components/auth-context";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

function SidebarPanelIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M5.5 3H2.5C2.22386 3 2 3.22386 2 3.5V12.5C2 12.7761 2.22386 13 2.5 13H5.5M5.5 3H13.5C13.7761 3 14 3.22386 14 3.5V12.5C14 12.7761 13.7761 13 13.5 13H5.5M5.5 3V13"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M6 7H10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9H10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M4.99554 13.1945C6.25588 13.9239 7.73847 14.1701 9.16691 13.8871C10.5953 13.6042 11.8721 12.8114 12.7592 11.6566C13.6463 10.5017 14.0831 9.06374 13.9883 7.61063C13.8934 6.15753 13.2734 4.78852 12.2437 3.75883C11.214 2.72915 9.84497 2.10907 8.39187 2.01422C6.93876 1.91936 5.50076 2.3562 4.34595 3.24328C3.19114 4.13037 2.39835 5.40715 2.11539 6.83559C1.83243 8.26403 2.07862 9.74662 2.80804 11.007L2.02617 13.3413C1.99679 13.4294 1.99253 13.524 2.01386 13.6144C2.03519 13.7047 2.08127 13.7874 2.14694 13.8531C2.2126 13.9187 2.29526 13.9648 2.38565 13.9861C2.47603 14.0075 2.57057 14.0032 2.65867 13.9738L4.99554 13.1945Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems = [
  { title: "New Chat", href: "/", icon: ChatCircle },
  { title: "Projects", href: "/projects", icon: FolderSimple },
  { title: "Connections", href: "/connections", icon: PlugsConnected },
  { title: "Skills", href: "/skills", icon: SkillsIcon },
];

const recentChats = [
  { id: "1", title: "别墅花园景观方案", date: "2 小时前" },
  { id: "2", title: "客厅软装搭配推荐", date: "昨天" },
  { id: "3", title: "办公空间灯光设计", date: "3 天前" },
];

function SearchCommand() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <SidebarMenuButton tooltip="Search" onClick={() => setOpen(true)}>
        <MagnifyingGlass weight="regular" />
        <span>Search</span>
        <kbd className="ml-auto text-[10px] font-medium text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
          ⌘K
        </kbd>
      </SidebarMenuButton>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="搜索"
        description="搜索对话、项目、资料"
      >
        <CommandInput placeholder="搜索对话、项目、资料..." />
        <CommandList>
          <CommandEmpty>未找到相关结果</CommandEmpty>
          <CommandGroup heading="最近对话">
            {recentChats.map((chat) => (
              <CommandItem key={chat.id} onSelect={() => setOpen(false)}>
                <ChatCircle weight="regular" />
                <span>{chat.title}</span>
                <CommandShortcut>{chat.date}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="页面">
            {navItems.map((item) => (
              <CommandItem key={item.title} onSelect={() => setOpen(false)}>
                <item.icon weight="regular" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="操作">
            <CommandItem onSelect={() => setOpen(false)}>
              <GearSix weight="regular" />
              <span>设置</span>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <Sun weight="regular" />
              <span>切换主题</span>
              <CommandShortcut>⌘T</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-[52px] justify-center px-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            <SidebarMenuButton
              asChild
              size="lg"
              className="flex-1 gap-2 py-0 group-data-[collapsible=icon]:hidden"
            >
              <Link href="/">
                <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
                  <span className="text-xs font-bold">C</span>
                </div>
                <span className="font-semibold tracking-tight">CoDesign</span>
              </Link>
            </SidebarMenuButton>
            <SidebarToggleButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item, index) => (
                <React.Fragment key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href)
                      }
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon weight="regular" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {index === 0 && (
                    <SidebarMenuItem>
                      <SearchCommand />
                    </SidebarMenuItem>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground">
            Recents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recentChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/chat/${chat.id}`}
                    tooltip={chat.title}
                    className="text-muted-foreground"
                  >
                    <Link href={`/chat/${chat.id}`}>
                      <ChatBubbleIcon className="size-4 shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="gap-3"
                  tooltip="User profile"
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarFallback className="bg-[#efbc00] text-white text-xs font-semibold">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm text-foreground/80">
                    Username
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56"
              >
                <DropdownMenuLabel>username@email.com</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <GearSix weight="regular" className="size-4" />
                  设置
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Sun weight="regular" className="size-4" />
                    主题
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun weight="regular" className="size-4" />
                      亮色
                      {mounted && theme === "light" && (
                        <Check weight="bold" className="ml-auto size-4" />
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon weight="regular" className="size-4" />
                      暗色
                      {mounted && theme === "dark" && (
                        <Check weight="bold" className="ml-auto size-4" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <GlobeSimple weight="regular" className="size-4" />
                    语言
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>
                      中文
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      English
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Info weight="regular" className="size-4" />
                  了解更多
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <SignOut weight="regular" className="size-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarToggleButton() {
  const { toggleSidebar, state, isMobile } = useSidebar();

  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      className="size-8 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
      onClick={toggleSidebar}
    >
      <SidebarPanelIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );

  if (state === "collapsed" && !isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          展开侧栏
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
