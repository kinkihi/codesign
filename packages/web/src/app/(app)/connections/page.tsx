"use client";

import {
  FolderSimple,
  GearSix,
  Plus,
  PlugsConnected,
} from "@phosphor-icons/react";

interface Connector {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: "connected" | "coming_soon";
}

function D5Logo({ seed = 0 }: { seed?: number }) {
  const gradients = [
    "from-violet-500 to-cyan-400",
    "from-rose-500 to-amber-400",
    "from-emerald-500 to-sky-400",
  ];
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-white">
      <div
        className={`size-6 rounded-full bg-gradient-to-br ${gradients[seed % gradients.length]}`}
      />
    </div>
  );
}

function IconBox({
  children,
  filled = true,
}: {
  children: React.ReactNode;
  filled?: boolean;
}) {
  return (
    <div
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg border border-border ${filled ? "bg-white" : "bg-secondary"}`}
    >
      {children}
    </div>
  );
}

function GoogleDriveIcon() {
  return (
    <IconBox>
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <path d="M20.4034 19.5625H11.6228L7.86279 25.9564C8.31513 26.1803 8.82879 26.3238 9.16102 26.3238C12.6151 26.3238 19.6644 26.2741 23.1637 26.2741C23.5235 26.2741 23.8603 26.1547 24.1624 25.9676L20.4034 19.5625Z" fill="#4185F3"/>
        <path d="M7.86312 25.9564L11.6231 19.5625H4.00397C4.00014 20.0068 4.16242 20.4134 4.4167 20.8771C5.1251 22.1673 6.32365 24.2298 7.02771 25.307C7.20123 25.5725 7.89021 25.9698 7.86312 25.9564Z" fill="#1767D1"/>
        <path d="M20.4038 19.562L24.1641 25.9661C24.6514 25.6646 25.0485 25.1869 25.3064 24.747C25.8885 23.7551 26.8729 22.1034 27.552 20.9851C27.8676 20.4651 27.9902 19.9981 27.9826 19.5615L20.4038 19.562Z" fill="#E94235"/>
        <path d="M11.6232 19.5622L16.009 12.1394L12.0893 5.77734C11.6654 6.04877 11.3027 6.41723 11.1381 6.69786C9.42719 9.61914 5.98051 15.6062 4.24734 18.5653C4.06974 18.8681 3.98471 19.214 4.00226 19.5622H11.6232Z" fill="#30A753"/>
        <path d="M20.403 19.5628L16.0093 12.14L19.8214 5.78516C20.2454 6.05683 20.7107 6.41783 20.8753 6.69871C22.5863 9.61974 26.0329 15.6068 27.7669 18.5659C27.9458 18.8702 27.9997 19.2145 27.9823 19.5628H20.403Z" fill="#F9BC00"/>
        <path d="M12.0898 5.77869L16.0101 12.1397L19.8222 5.78491C19.4286 5.561 18.8713 5.4284 18.3315 5.41173C16.8299 5.36297 14.3955 5.34331 13.0852 5.39879C12.7622 5.41247 12.0939 5.77595 12.0898 5.77869V5.77869Z" fill="#0F8038"/>
      </svg>
    </IconBox>
  );
}

function OneDriveIcon() {
  return (
    <IconBox>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <g clipPath="url(#clip_onedrive)">
          <path d="M9.15135 8.58219L9.15159 8.58136L14.1898 11.5992L17.192 10.3358L17.1922 10.3363C17.8022 10.0726 18.4599 9.93685 19.1245 9.9375C19.2352 9.9375 19.3447 9.94252 19.4536 9.94979C19.0927 8.54235 18.3307 7.27005 17.2603 6.28749C16.1899 5.30494 14.8572 4.65443 13.424 4.41502C11.9909 4.17561 10.5191 4.35761 9.18745 4.9389C7.85581 5.52019 6.72167 6.47574 5.92285 7.68943C5.94852 7.68911 5.97379 7.6875 5.99952 7.6875C7.113 7.68599 8.20472 7.99589 9.15135 8.58219Z" fill="#0364B8"/>
          <path d="M9.15207 8.58137L9.15184 8.5822C8.20521 7.9959 7.11349 7.686 6 7.68751C5.97427 7.68751 5.94896 7.68912 5.92333 7.68944C4.8335 7.70293 3.76796 8.01314 2.84119 8.58673C1.91443 9.16033 1.16149 9.97562 0.663278 10.945C0.165069 11.9144 -0.0595727 13.0012 0.0134948 14.0886C0.0865624 15.1761 0.454576 16.2231 1.07799 17.1171L5.52099 15.2474L7.49605 14.4163L11.8937 12.5657L14.1903 11.5992L9.15207 8.58137Z" fill="#0078D4"/>
          <path d="M19.4542 9.94979C19.3453 9.94253 19.2359 9.9375 19.1251 9.9375C18.4605 9.93685 17.8028 10.0726 17.1928 10.3363L17.1926 10.3358L14.1904 11.5992L15.061 12.1207L17.9147 13.83L19.1598 14.5758L23.417 17.1258C23.8039 16.4077 24.0043 15.604 24.0001 14.7884C23.9958 13.9727 23.7869 13.1711 23.3926 12.4571C22.9983 11.7431 22.4312 11.1394 21.7431 10.7013C21.055 10.2633 20.268 10.0049 19.4542 9.9498V9.94979Z" fill="#1490DF"/>
          <path d="M19.1598 14.5762L17.9147 13.8304L15.061 12.1211L14.1904 11.5996L11.8938 12.566L7.49619 14.4166L5.52112 15.2478L1.07812 17.1175C1.63025 17.9113 2.36629 18.5597 3.22339 19.0073C4.08049 19.4549 5.03319 19.6884 6.00013 19.6879H19.1251C20.0051 19.6882 20.8688 19.4501 21.6245 18.9991C22.3801 18.5481 22.9995 17.9009 23.417 17.1262L19.1598 14.5762Z" fill="#28A8EA"/>
        </g>
        <defs>
          <clipPath id="clip_onedrive">
            <rect width="24" height="24" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    </IconBox>
  );
}

function DropboxIcon() {
  return (
    <IconBox>
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <path d="M9.99949 5.33301L4 9.15531L9.99949 12.9776L16 9.15531L9.99949 5.33301Z" fill="#0061FF"/>
        <path d="M22 5.33301L16 9.15566L22 12.9783L28.0001 9.15566L22 5.33301Z" fill="#0061FF"/>
        <path d="M4 16.8008L9.99949 20.6231L16 16.8008L9.99949 12.9785L4 16.8008Z" fill="#0061FF"/>
        <path d="M22 12.9785L16 16.8011L22 20.6238L28 16.8011L22 12.9785Z" fill="#0061FF"/>
        <path d="M10 21.9053L16.0005 25.7276L22 21.9053L16.0005 18.083L10 21.9053Z" fill="#0061FF"/>
      </svg>
    </IconBox>
  );
}

function EgnyteIcon() {
  return (
    <IconBox>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path fillRule="evenodd" clipRule="evenodd" d="M12.7907 7.29195H11.2143C11.1082 7.29195 11.0215 7.20369 11.0215 7.09627V0.945683C11.0215 0.838249 11.1082 0.75 11.2143 0.75H12.7907C12.8967 0.75 12.9837 0.838249 12.9837 0.945683V7.09627C12.9837 7.20369 12.8967 7.29195 12.7907 7.29195Z" fill="#32BDB5"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M16.104 15.8907L16.8906 14.5056C16.9435 14.4135 17.0605 14.379 17.1552 14.4327L22.403 17.5061C22.4935 17.5598 22.5276 17.6787 22.4748 17.7746L21.6882 19.1597C21.6353 19.2518 21.5182 19.2864 21.4235 19.2327L16.1758 16.1593C16.0815 16.1017 16.0511 15.9828 16.104 15.8907Z" fill="#32BDB5"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M7.11023 14.5054L7.89657 15.8906C7.9494 15.9826 7.91936 16.1055 7.82466 16.1591L2.57693 19.2325C2.4861 19.2862 2.36523 19.2555 2.31232 19.1597L1.52606 17.7745C1.47284 17.6824 1.50327 17.5596 1.59789 17.5059L6.84562 14.4325C6.93614 14.3788 7.0574 14.4095 7.11023 14.5054Z" fill="#32BDB5"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M21.932 8.65019L20.3024 5.78788C20.2043 5.61905 19.9926 5.55767 19.8223 5.65741L11.9959 10.2425L4.16958 5.65741C4.00345 5.55767 3.78788 5.61905 3.68972 5.78788L2.06011 8.65019C1.96171 8.81902 2.02219 9.03772 2.18863 9.13746L10.015 13.7226V22.8928C10.015 23.0885 10.1698 23.2497 10.3663 23.2497H13.6217C13.8144 23.2497 13.9734 23.0924 13.9734 22.8928V13.7226L21.7997 9.13746C21.9697 9.03772 22.0263 8.81902 21.932 8.65019Z" fill="black"/>
      </svg>
    </IconBox>
  );
}

const myConnections: Connector[] = [
  {
    name: "D5 Render",
    description: "深度设计表达，动画及演示制作",
    icon: <D5Logo seed={0} />,
    status: "connected",
  },
  {
    name: "D5 Lite",
    description: "内置 DCC 工作流，轻量设计推敲工具",
    icon: <D5Logo seed={1} />,
    status: "connected",
  },
  {
    name: "D5 Works",
    description: "关联海量精品素材，智能推荐及搭配",
    icon: <D5Logo seed={2} />,
    status: "connected",
  },
  {
    name: "本地资源",
    description: "选择需要关联的本地文件夹，自动索引文档与资料",
    icon: (
      <IconBox>
        <FolderSimple size={20} weight="regular" className="text-neutral-700" />
      </IconBox>
    ),
    status: "connected",
  },
];

const comingSoonConnections: Connector[] = [
  {
    name: "Google Driver",
    description: "Find and analyze files instantly",
    icon: <GoogleDriveIcon />,
    status: "coming_soon",
  },
  {
    name: "OneDriver",
    description: "...",
    icon: <OneDriveIcon />,
    status: "coming_soon",
  },
  {
    name: "Dropbox",
    description: "...",
    icon: <DropboxIcon />,
    status: "coming_soon",
  },
  {
    name: "Egnyte",
    description: "Share and Co-Edit Complex Files Without Missing a Beat",
    icon: <EgnyteIcon />,
    status: "coming_soon",
  },
  {
    name: "Add custom connector",
    description: "Connect d5 to your data and tools.",
    icon: (
      <IconBox filled={false}>
        <Plus size={18} weight="regular" className="text-foreground/60" />
      </IconBox>
    ),
    status: "coming_soon",
  },
];

function ConnectorCard({
  connector,
  variant,
}: {
  connector: Connector;
  variant: "filled" | "outline";
}) {
  return (
    <div
      className={`flex w-[calc(50%-8px)] cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
        variant === "filled"
          ? "border-border bg-card hover:bg-accent/50"
          : "border-border hover:bg-accent/30"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {connector.icon}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-[15px] font-medium leading-5 text-foreground">
            {connector.name}
          </span>
          <span className="truncate text-[13px] leading-5 text-muted-foreground">
            {connector.description}
          </span>
        </div>
      </div>
      {connector.status === "coming_soon" && (
        <span className="shrink-0 rounded bg-secondary px-1.5 py-1 text-[11px] font-semibold text-muted-foreground">
          Coming Soon
        </span>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <PlugsConnected size={20} weight="regular" />
        <h1 className="flex-1 text-base font-semibold">Connections</h1>
        <button
          type="button"
          className="-my-1 flex h-8 items-center justify-center gap-1.5 rounded border border-border px-3 text-xs text-foreground transition-colors hover:bg-accent"
        >
          <GearSix size={14} weight="regular" />
          设置
        </button>
      </div>
      <div className="flex-1 overflow-auto p-10">
        <div className="flex w-full flex-col gap-10">
          {/* 我的连接 */}
          <section className="flex flex-col">
            <div className="mb-0 flex h-12 items-center">
              <h2 className="text-base font-medium text-foreground">
                我的连接
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {myConnections.map((connector) => (
                <ConnectorCard
                  key={connector.name}
                  connector={connector}
                  variant="filled"
                />
              ))}
            </div>
          </section>

          {/* 即将推出 */}
          <section className="flex flex-col">
            <div className="mb-0 flex h-12 items-center justify-between">
              <h2 className="text-base font-medium text-foreground">
                即将推出
              </h2>
            </div>
            <div className="flex flex-wrap gap-4">
              {comingSoonConnections.map((connector) => (
                <ConnectorCard
                  key={connector.name}
                  connector={connector}
                  variant="outline"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
