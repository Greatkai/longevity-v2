"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  Menu,
  X,
  Stethoscope,
  LayoutDashboard,
  History,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth-store";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  const authLinks = user
    ? [
        { href: "/history", label: "我的报告", icon: History },
        ...(user.role === "health_coach" || user.role === "admin"
          ? [{ href: "/coach", label: "工作台", icon: Stethoscope }]
          : []),
        ...(user.role === "admin"
          ? [{ href: "/admin", label: "管理后台", icon: ShieldCheck }]
          : []),
      ]
    : [];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 shadow-lg shadow-brand-900/10 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold text-white">百岁白皮书</div>
            <div className="text-[11px] tracking-wide text-white/70">
              中国百岁健康标准指数评估
            </div>
          </div>
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            首页
          </Link>
          <Link
            href="/questionnaire"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            开始评估
          </Link>
          {authLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="ml-3 flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5">
                <User className="h-4 w-4 text-white/70" />
                <span className="max-w-[120px] truncate text-sm font-medium text-white">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-all hover:shadow-md active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-3 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-all hover:shadow-md active:scale-95"
            >
              <Activity className="h-4 w-4" />
              登录 / 注册
            </Link>
          )}
        </nav>

        {/* 移动端汉堡按钮 */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
          aria-label="打开菜单"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* 移动端菜单 */}
      <div
        className={cn(
          "overflow-hidden border-t border-white/10 bg-brand-800 transition-all duration-300 md:hidden",
          open ? "max-h-[480px]" : "max-h-0"
        )}
      >
        <div className="container-page flex flex-col gap-1 py-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/10"
          >
            <LayoutDashboard className="h-4 w-4" />
            首页
          </Link>
          <Link
            href="/questionnaire"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/10"
          >
            <Activity className="h-4 w-4" />
            开始评估
          </Link>
          {authLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/10"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}

          {user ? (
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700"
            >
              <LogOut className="h-4 w-4" />
              退出登录（{user.name}）
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700"
            >
              <Activity className="h-4 w-4" />
              登录 / 注册
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
