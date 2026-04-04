"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsersThree } from "@phosphor-icons/react";
import { useAuth } from "@/components/auth-context";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth();

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <Card className="overflow-hidden rounded-2xl border-0 p-0 shadow-xl ring-1 ring-foreground/5">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left side — placeholder image */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-muted" />
          </div>

          {/* Right side — form (swapped from login-04 original) */}
          <form
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center gap-1">
                <h1 className="text-2xl font-bold">欢迎回来</h1>
                <p className="text-balance text-muted-foreground">
                  登录您的 CoDesign 账户
                </p>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    defaultValue="user@codesign.ai"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">密码</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      忘记密码？
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    defaultValue="password"
                  />
                </div>
                <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90">
                  登录
                </Button>
              </div>

              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-card px-2 text-muted-foreground">
                  或通过以下方式登录
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={login}
                >
                  <UsersThree weight="regular" className="size-4" />
                  SSO
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={login}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="size-4"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Google
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                还没有账户？{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                  注册
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        点击继续即表示您同意我们的 <a href="#">服务条款</a>{" "}
        和 <a href="#">隐私政策</a>。
      </div>
    </div>
  );
}
