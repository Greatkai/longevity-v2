"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  FileText,
  Trash2,
  Loader2,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  Clock,
  Gauge,
  ClipboardList,
  Stethoscope,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "@/store/auth-store";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin" | "health_coach";
  status: "active" | "disabled";
  createdAt: string;
  lastLoginAt: string | null;
}

interface Stats {
  users: number;
  reports: number;
  activeUsers: number;
  admins: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

interface RecentReport {
  id: number;
  chliScore: number;
  level: string;
  createdAt: string;
  userEmail: string;
  userName: string;
}

interface DashboardData {
  users: AdminUser[];
  stats: Stats;
  trend: { reports: TrendPoint[]; users: TrendPoint[] };
  scoreDistribution: { range: string; count: number }[];
  levelDistribution: { level: string; count: number }[];
  dimensionAverages: { name: string; avg: number }[];
  recentReports: RecentReport[];
}

const LEVEL_COLORS: Record<string, string> = {
  excellent: "#10B981",
  good: "#2E8BE6",
  moderate: "#F59E0B",
  risk: "#F97316",
  highRisk: "#EF4444",
};

const LEVEL_LABELS: Record<string, string> = {
  excellent: "优",
  good: "良",
  moderate: "中",
  risk: "风险",
  highRisk: "高风险",
};

const BUCKET_COLORS = ["#EF4444", "#F97316", "#F59E0B", "#2E8BE6", "#10B981"];
const DIM_COLORS = ["#005BAC", "#14B8A6", "#F59E0B", "#0EA5E9", "#8B5CF6", "#EC4899"];

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "加载失败");
        if (res.status === 403) router.replace("/");
        return;
      }
      setData(json);
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.replace("/");
      } else {
        loadData();
      }
    }
  }, [authLoading, user, router, loadData]);

  const toggleStatus = async (u: AdminUser) => {
    setOperating(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: u.status === "active" ? "disabled" : "active",
        }),
      });
      if (res.ok) await loadData();
    } catch {
      // ignore
    } finally {
      setOperating(null);
    }
  };

  /** 切换用户角色（普通用户 <-> 健康管理师） */
  const toggleRole = async (u: AdminUser) => {
    const nextRole = u.role === "health_coach" ? "user" : "health_coach";
    setOperating(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) await loadData();
    } catch {
      // ignore
    } finally {
      setOperating(null);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`确定删除用户 ${u.email} 吗？其所有报告也会被删除。`)) return;
    setOperating(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (res.ok) await loadData();
    } catch {
      // ignore
    } finally {
      setOperating(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  };

  const stats = data?.stats;
  const avgScore = useMemo(() => {
    const dist = data?.scoreDistribution ?? [];
    const total = dist.reduce((s, d) => s + d.count, 0);
    if (!total) return 0;
    const midpoints: Record<string, number> = {
      "0-40": 20,
      "40-60": 50,
      "60-75": 67.5,
      "75-90": 82.5,
      "90-100": 95,
    };
    const sum = dist.reduce((s, d) => s + (midpoints[d.range] ?? 0) * d.count, 0);
    return Math.round(sum / total);
  }, [data]);

  const statCards = [
    { label: "总用户数", value: stats?.users ?? 0, icon: Users, color: "bg-brand-50 text-brand-600", sub: `活跃 ${stats?.activeUsers ?? 0}` },
    { label: "评估报告", value: stats?.reports ?? 0, icon: FileText, color: "bg-amber-50 text-amber-600", sub: "累计生成" },
    { label: "平均得分", value: avgScore, icon: Gauge, color: "bg-emerald-50 text-emerald-600", sub: "CHLI 均值" },
    { label: "管理员", value: stats?.admins ?? 0, icon: ShieldCheck, color: "bg-violet-50 text-violet-600", sub: "角色" },
  ];

  const reportTotal = useMemo(() => {
    const dist = data?.scoreDistribution ?? [];
    return dist.reduce((s, d) => s + d.count, 0);
  }, [data]);

  const levelData = (data?.levelDistribution ?? []).map((d) => ({
    name: LEVEL_LABELS[d.level] ?? d.level,
    value: d.count,
    color: LEVEL_COLORS[d.level] ?? "#9CA3AF",
  }));

  const emptyDist = [
    { range: "0-40", count: 0 },
    { range: "40-60", count: 0 },
    { range: "60-75", count: 0 },
    { range: "75-90", count: 0 },
    { range: "90-100", count: 0 },
  ];
  const distMap = new Map((data?.scoreDistribution ?? []).map((d) => [d.range, d.count]));
  const scoreData = emptyDist.map((d) => ({ range: d.range, count: distMap.get(d.range) ?? 0 }));

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft pt-16">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-600" />
          <p className="mt-3 text-sm text-ink-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft pt-16">
      <div className="container-page py-10">
        {/* 页头 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">管理后台</h1>
              <p className="text-sm text-ink-600">用户管理 · 系统数据概览</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
          >
            <Activity className="h-4 w-4" />
            刷新数据
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 统计卡片 */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="card card-accent card-hover flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-ink-900">{card.value}</div>
                <div className="truncate text-xs text-ink-500">
                  {card.label} · {card.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 趋势图 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card card-accent p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-ink-900">近 30 天评估报告趋势</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trend?.reports ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2E8BE6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2E8BE6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EDF8" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #DCE8F7", fontSize: 12 }}
                    formatter={(value) => [`${value} 份`, "报告"]}
                  />
                  <Area type="monotone" dataKey="count" stroke="#2E8BE6" strokeWidth={2.5} fill="url(#reportGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card card-accent p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-ink-900">近 30 天注册用户趋势</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trend?.users ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EDF8" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval={5} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #DCE8F7", fontSize: 12 }}
                    formatter={(value) => [`${value} 人`, "注册"]}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2.5} fill="url(#userGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 分布图 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* 得分分布 */}
          <div className="card p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-ink-900">CHLI 得分分布</h2>
              <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                共 {reportTotal} 份
              </span>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EDF8" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "#F4F7FB" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #DCE8F7", fontSize: 12 }}
                    formatter={(value) => [`${value} 份`, "报告数"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {scoreData.map((_, i) => (
                      <Cell key={i} fill={BUCKET_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 等级分布 */}
          <div className="card card-accent p-6">
            <div className="mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-ink-900">风险等级分布</h2>
            </div>
            <div className="h-60">
              {levelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={levelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {levelData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #DCE8F7", fontSize: 12 }}
                      formatter={(value, name) => [`${value} 份`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-400">
                  暂无数据
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {levelData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-ink-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name} {d.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 维度平均分 + 最近报告 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <RadarIcon className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-ink-900">六大维度平均分</h2>
            </div>
            <div className="h-72">
              {(data?.dimensionAverages?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.dimensionAverages ?? []}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                  >
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={70}
                      tick={{ fontSize: 11, fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#F4F7FB" }}
                      contentStyle={{ borderRadius: 12, border: "1px solid #DCE8F7", fontSize: 12 }}
                      formatter={(value) => [`${value} 分`, "平均分"]}
                    />
                    <Bar dataKey="avg" radius={[0, 6, 6, 0]} maxBarSize={18}>
                      {(data?.dimensionAverages ?? []).map((_, i) => (
                        <Cell key={i} fill={DIM_COLORS[i % DIM_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink-400">
                  暂无评估数据
                </div>
              )}
            </div>
          </div>

          {/* 最近报告 */}
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50/60 px-6 py-4">
              <ClipboardList className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-ink-900">最近评估报告</h2>
            </div>
            <div className="divide-y divide-brand-50">
              {(data?.recentReports ?? []).length > 0 ? (
                data?.recentReports.slice(0, 8).map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-white"
                      style={{ backgroundColor: LEVEL_COLORS[r.level] ?? "#9CA3AF" }}
                    >
                      {Math.round(r.chliScore)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink-900">
                          {r.userName || r.userEmail}
                        </span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: LEVEL_COLORS[r.level] ?? "#9CA3AF" }}
                        >
                          {LEVEL_LABELS[r.level] ?? r.level}
                        </span>
                      </div>
                      <div className="truncate text-xs text-ink-400">{r.userEmail}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-xs text-ink-400">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(r.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-sm text-ink-400">
                  暂无评估报告
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 用户管理 */}
        <div className="card mt-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-brand-100 bg-brand-50/60 px-6 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-ink-900">用户列表</h2>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-brand-700 shadow-sm">
                {data?.users.length ?? 0} 人
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 bg-white text-xs uppercase text-ink-400">
                  <th className="px-6 py-3 font-semibold">用户</th>
                  <th className="px-5 py-3 font-semibold">角色</th>
                  <th className="px-5 py-3 font-semibold">状态</th>
                  <th className="px-5 py-3 font-semibold">注册时间</th>
                  <th className="px-5 py-3 font-semibold">最近登录</th>
                  <th className="px-5 py-3 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {data?.users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-brand-50 transition-colors hover:bg-brand-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink-900">{u.name || "—"}</div>
                      <div className="text-xs text-ink-400">{u.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-violet-100 text-violet-700"
                            : u.role === "health_coach"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-brand-100 text-brand-700"
                        }`}
                      >
                        {u.role === "admin"
                          ? "管理员"
                          : u.role === "health_coach"
                          ? "健康管理师"
                          : "普通用户"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {u.status === "active" ? (
                          <Activity className="h-3 w-3" />
                        ) : (
                          <UserX className="h-3 w-3" />
                        )}
                        {u.status === "active" ? "正常" : "已禁用"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4 text-ink-500">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleStatus(u)}
                          disabled={operating === u.id || u.id === user?.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {u.status === "active" ? (
                            <UserX className="h-3.5 w-3.5" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          {u.status === "active" ? "禁用" : "启用"}
                        </button>
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={operating === u.id || u.id === user?.id || u.role === "admin"}
                          className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Stethoscope className="h-3.5 w-3.5" />
                          {u.role === "health_coach" ? "设为普通用户" : "设为健康管理师"}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={operating === u.id || u.id === user?.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-ink-400">
                      暂无用户
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
