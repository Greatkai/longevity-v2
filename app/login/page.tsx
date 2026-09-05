"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, Stethoscope, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth-store";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-soft px-4 pt-16">
      {/* 背景装饰 */}
      <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" />
      <div className="glow-ring pointer-events-none left-[-60px] top-24 h-72 w-72 bg-brand-200/50" />
      <div className="glow-ring pointer-events-none right-[-60px] bottom-20 h-80 w-80 bg-brand-100/60" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-brand-500/30">
            <Stethoscope className="h-9 w-9" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-ink-900">百岁白皮书</h1>
          <p className="mt-1 text-sm text-ink-600">
            {mode === "login" ? "登录以管理您的长寿评估报告" : "注册账号，开启健康寿命评估"}
          </p>
        </div>

        <div className="card card-accent p-8">
          {/* Tab 切换 */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-brand-50 p-1">
            {(
              [
                { key: "login", label: "登录" },
                { key: "register", label: "注册" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setMode(tab.key);
                  setError("");
                }}
                className={cn(
                  "rounded-lg py-2.5 text-sm font-semibold transition-all",
                  mode === tab.key
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-ink-600 hover:text-brand-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-600">
                  昵称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入昵称"
                  className="input-base"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-600">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-600">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "至少 6 位" : "请输入密码"}
                className="input-base"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Activity className="h-5 w-5" />
                  {mode === "login" ? "登录" : "注册并登录"}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-ink-400">
            评估功能可匿名体验，登录后可保存历史报告
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
