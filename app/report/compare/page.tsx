"use client";

import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  GitCompareArrows,
  Download,
  Check,
  Minus,
  TrendingUp,
  TrendingDown,
  CircleEqual,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/store/auth-store";
import { BackToTop } from "@/components/common/BackToTop";
import type { AssessmentResult } from "@/lib/chli-model";
import { RISK_META } from "@/lib/chli-model";
import { SUB_BY_DIMENSION, LAB_CHECKLIST } from "@/lib/chli-model/sub-indicators";
import { FM_IMBALANCES } from "@/lib/functional-survey/questions";
import type { FMCategories } from "@/lib/functional-survey/types";

interface CompareReport {
  id: number;
  code: string;
  createdAt: string;
  result: AssessmentResult;
}

const SERIES_COLORS = ["#0A5BA8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
const DIM_KEYS = ["B", "F", "M", "L", "P", "D"];

function CompareContent() {
  const router = useRouter();
  const params = useSearchParams();
  const ids = useMemo(
    () => (params.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0),
    [params]
  );
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<CompareReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dim, setDim] = useState<string>("TOTAL");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/history");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || ids.length === 0) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const loaded = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/reports/${id}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "加载失败");
            return {
              id,
              code: json.report.payload?.reportCode ?? `#${id}`,
              createdAt: json.report.createdAt,
              result: json.report.payload as AssessmentResult,
            } as CompareReport;
          })
        );
        // 按时间正序（第 1 次 → 第 N 次）
        loaded.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setReports(loaded);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params]);

  /** 某报告是否提供某检验项 */
  const hasLab = (r: CompareReport, subKey: string): boolean | null => {
    const sd = r.result.sourceData as Record<string, unknown> | undefined;
    const map: Record<string, string> = {
      B2: "bio.epigeneticAge.available",
      B3: "bio.inflammation.available",
      M1: "metabolic.hba1c.available",
      M2: "metabolic.ldl.available",
      M5: "metabolic.liverKidney.available",
      F2: "functional.gaitSpeed.available",
      F3: "functional.gripStrength.available",
      F4: "functional.balance.available",
      F5: "functional.cognitiveTest.available",
      D3: "digital.improvingTrend.available",
    };
    const p = map[subKey];
    if (!p || !sd) return null;
    const keys = p.split(".");
    let cur: unknown = sd;
    for (const k of keys) {
      if (cur == null || typeof cur !== "object") return false;
      cur = (cur as Record<string, unknown>)[k];
    }
    return cur === 1 || cur === true;
  };

  /** 二级指标对比行（按维度分组，含趋势） */
  const subRows = useMemo(() => {
    if (reports.length === 0) return [];
    const rows: {
      dim: string;
      key: string;
      name: string;
      values: (number | null)[];
      trend: "up" | "down" | "flat" | null;
    }[] = [];
    DIM_KEYS.forEach((dim) => {
      const subs = SUB_BY_DIMENSION[dim] ?? [];
      subs.forEach((s) => {
        const values = reports.map((r) => {
          const d = r.result.dimensions.find((x) => x.key === dim);
          return d?.details?.[s.key] ?? null;
        });
        if (values.every((v) => v === null)) return;
        const present = values.filter((v): v is number => v !== null);
        let trend: "up" | "down" | "flat" | null = null;
        if (present.length === values.length && present.length >= 2) {
          const delta = present[present.length - 1] - present[0];
          trend = delta > 2 ? "up" : delta < -2 ? "down" : "flat";
        }
        rows.push({ dim, key: s.key, name: s.name, values, trend });
      });
    });
    return rows;
  }, [reports]);

  /** FM 失衡类别对比行 */
  const fmRows = useMemo(() => {
    const withFm = reports.filter((r) => r.result.functional?.included);
    if (withFm.length === 0) return null;
    return {
      reports: withFm,
      rows: (Object.keys(FM_IMBALANCES) as FMCategories[]).map((cat) => ({
        cat,
        name: `${FM_IMBALANCES[cat].icon} ${FM_IMBALANCES[cat].name}`,
        values: withFm.map((r) => {
          const c = r.result.functional?.categories.find((x) => x.cat === cat);
          return c?.rate ?? null;
        }),
      })),
    };
  }, [reports]);

  /** 趋势图数据 */
  const chartData = useMemo(() => {
    return reports.map((r, i) => {
      const row: Record<string, number | string | null> = {
        name: `第 ${i + 1} 次`,
      };
      if (dim === "TOTAL") {
        row["综合长寿指数"] = Math.round(r.result.chliScore * 10) / 10;
        if (r.result.fshi) row["FSHI"] = Math.round(r.result.fshi.score * 10) / 10;
      } else {
        const d = r.result.dimensions.find((x) => x.key === dim);
        (SUB_BY_DIMENSION[dim] ?? []).forEach((s) => {
          row[s.name] = d?.details?.[s.key] ?? null;
        });
      }
      return row;
    });
  }, [reports, dim]);

  const chartLines = useMemo(() => {
    if (reports.length === 0) return [];
    if (dim === "TOTAL") {
      return reports.some((r) => r.result.fshi)
        ? [
            { key: "综合长寿指数", name: "综合长寿指数" },
            { key: "FSHI", name: "FSHI" },
          ]
        : [{ key: "综合长寿指数", name: "综合长寿指数" }];
    }
    return (SUB_BY_DIMENSION[dim] ?? []).map((s) => ({ key: s.name, name: s.name }));
  }, [reports, dim]);

  /** 导出对比报告 PDF */
  const handleExport = async () => {
    setExporting(true);
    try {
      const { exportComparePDF } = await import("@/lib/export/compare-export");
      await exportComparePDF(reports);
    } catch (e) {
      console.error("对比报告导出失败:", e);
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || reports.length < 2) {
    return (
      <div className="min-h-screen bg-brand-soft pt-16">
        <div className="container-page py-10 text-center">
          <p className="text-lg text-ink-600">{error || "请至少选择 2 份报告进行对比"}</p>
          <Link href="/history" className="btn-primary mt-4 inline-flex">
            <ArrowLeft className="h-5 w-5" />
            返回我的报告
          </Link>
        </div>
      </div>
    );
  }

  const trendIcon = (trend: "up" | "down" | "flat" | null) => {
    if (trend === "up")
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />
          改善
        </span>
      );
    if (trend === "down")
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600">
          <TrendingDown className="h-3.5 w-3.5" />
          下降
        </span>
      );
    if (trend === "flat")
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-ink-400">
          <CircleEqual className="h-3.5 w-3.5" />
          持平
        </span>
      );
    return <span className="text-xs text-ink-300">—</span>;
  };

  return (
    <div className="min-h-screen bg-brand-soft pt-16">
      <div className="container-page py-10">
        {/* 页头 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-lg">
              <GitCompareArrows className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">报告对比分析</h1>
              <p className="text-sm text-ink-600">
                {reports.length} 份报告 · 按时间从第 1 次到第 {reports.length} 次
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/history" className="btn-secondary">
              <ArrowLeft className="h-5 w-5" />
              返回
            </Link>
            <button onClick={handleExport} disabled={exporting} className="btn-primary disabled:opacity-60">
              {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              导出对比报告
            </button>
          </div>
        </div>

        {/* 报告概览 chips */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {reports.map((r, i) => {
            const meta = RISK_META[r.result.level] || RISK_META.moderate;
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                    第 {i + 1} 次
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-3xl font-bold text-ink-900">
                    {Math.round(r.result.chliScore)}
                    <span className="text-sm font-normal text-ink-400">/100</span>
                  </span>
                  <span className="text-xs text-ink-400">
                    {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
                <p className="mt-2 truncate font-mono text-[11px] text-brand-500">{r.code}</p>
              </div>
            );
          })}
        </div>

        {/* 趋势图 */}
        <div className="card card-accent mt-8 p-6 md:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-8 w-1.5 rounded-full bg-brand-gradient" />
              <h3 className="text-lg font-bold text-ink-900">指标趋势</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDim("TOTAL")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  dim === "TOTAL" ? "bg-brand-600 text-white shadow-sm" : "bg-brand-50 text-ink-600 hover:bg-brand-100"
                )}
              >
                总分
              </button>
              {DIM_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setDim(k)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    dim === k ? "bg-brand-600 text-white shadow-sm" : "bg-brand-50 text-ink-600 hover:bg-brand-100"
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F0FA" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#8494A6" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#8494A6" />
                <Tooltip />
                <Legend />
                {chartLines.map((l, i) => (
                  <Line
                    key={l.key}
                    type="monotone"
                    dataKey={l.key}
                    name={l.name}
                    stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 二级指标对比表（相同指标 + 趋势） */}
        <div className="card card-accent mt-8 overflow-hidden">
          <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-white px-6 py-5">
            <h3 className="text-lg font-bold text-ink-900">二级指标对比</h3>
            <p className="mt-1 text-xs text-ink-500">
              相同指标展示得分与趋势（首末对比，±2 分以内视为持平）；某次报告未涉及的指标显示「—」
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-brand-100 bg-brand-50/50 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-semibold">指标</th>
                  {reports.map((r, i) => (
                    <th key={r.id} className="px-4 py-3 text-center font-semibold">
                      第 {i + 1} 次
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold">趋势</th>
                </tr>
              </thead>
              <tbody>
                {DIM_KEYS.map((dim) => {
                  const rows = subRows.filter((row) => row.dim === dim);
                  if (rows.length === 0) return null;
                  return (
                    <Fragment key={dim}>
                      <tr className="bg-brand-50/30">
                        <td colSpan={reports.length + 2} className="px-5 py-2 text-xs font-bold text-brand-700">
                          {dim} · {DIM_LABELS[dim]}
                        </td>
                      </tr>
                      {rows.map((row) => (
                        <tr key={`${dim}-${row.key}`} className="border-b border-brand-50">
                          <td className="px-5 py-2.5 text-ink-700">{row.name}</td>
                          {row.values.map((v, i) => (
                            <td key={i} className="px-4 py-2.5 text-center font-semibold tabular-nums text-ink-900">
                              {v !== null ? Math.round(v) : <span className="text-ink-300">—</span>}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-center">{trendIcon(row.trend)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 差异对比 */}
        <div className="card card-accent mt-8 overflow-hidden">
          <div className="border-b border-brand-100 bg-gradient-to-r from-teal-50/80 to-white px-6 py-5">
            <h3 className="text-lg font-bold text-ink-900">差异对比</h3>
            <p className="mt-1 text-xs text-ink-500">各报告包含的模块与数据差异（✓ = 有，— = 无）</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-brand-100 bg-brand-50/50 text-left text-xs text-ink-500">
                  <th className="px-5 py-3 font-semibold">项目</th>
                  {reports.map((r, i) => (
                    <th key={r.id} className="px-4 py-3 text-center font-semibold">
                      第 {i + 1} 次
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "功能失衡评估", has: (r: CompareReport) => !!r.result.functional?.included },
                  { name: "FSHI 附加模块", has: (r: CompareReport) => !!r.result.fshi },
                  {
                    name: "原始填写数据（支持个性化检验建议）",
                    has: (r: CompareReport) => !!r.result.sourceData,
                  },
                ].map((row) => (
                  <tr key={row.name} className="border-b border-brand-50">
                    <td className="px-5 py-2.5 text-ink-700">{row.name}</td>
                    {reports.map((r) => (
                      <td key={r.id} className="px-4 py-2.5 text-center">
                        {row.has(r) ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-600" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-ink-300" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FM 失衡类别对比 */}
          {fmRows && (
            <div className="border-t border-brand-100">
              <div className="px-6 pt-5">
                <h4 className="text-sm font-bold text-ink-900">功能失衡类别对比（失衡率 %，越高越需关注）</h4>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-brand-100 bg-brand-50/50 text-left text-xs text-ink-500">
                      <th className="px-4 py-2.5 font-semibold">类别</th>
                      {fmRows.reports.map((r, i) => (
                        <th key={r.id} className="px-4 py-2.5 text-center font-semibold">
                          第 {reports.indexOf(r) + 1} 次
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fmRows.rows.map((row) => (
                      <tr key={row.cat} className="border-b border-brand-50">
                        <td className="px-4 py-2.5 text-ink-700">{row.name}</td>
                        {row.values.map((v, i) => (
                          <td
                            key={i}
                            className={cn(
                              "px-4 py-2.5 text-center font-semibold tabular-nums",
                              v === null ? "text-ink-300" : v >= 30 ? "text-orange-600" : "text-ink-900"
                            )}
                          >
                            {v !== null ? `${v}%` : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 检验报告提供情况 */}
          <div className="border-t border-brand-100">
            <div className="px-6 pt-5">
              <h4 className="text-sm font-bold text-ink-900">检验报告提供情况</h4>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-brand-100 bg-brand-50/50 text-left text-xs text-ink-500">
                    <th className="px-4 py-2.5 font-semibold">检验项</th>
                    {reports.map((r, i) => (
                      <th key={r.id} className="px-4 py-2.5 text-center font-semibold">
                        第 {reports.indexOf(r) + 1} 次
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LAB_CHECKLIST.map((item) => (
                    <tr key={item.subKey} className="border-b border-brand-50">
                      <td className="px-4 py-2.5 text-ink-700">
                        {item.name}
                        {item.recommended && (
                          <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700">
                            推荐
                          </span>
                        )}
                      </td>
                      {reports.map((r) => {
                        const has = hasLab(r, item.subKey);
                        return (
                          <td key={r.id} className="px-4 py-2.5 text-center">
                            {has ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-ink-300" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p className="mt-6 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
          提示：对比按时间正序进行，趋势以第 1 次与最新一次的差值判定（±2 分以内视为持平）。导出的对比报告可直接带去线下解读。
        </p>
      </div>
      <BackToTop />
    </div>
  );
}

const DIM_LABELS: Record<string, string> = {
  B: "生物年龄",
  F: "功能健康",
  M: "代谢慢病",
  L: "生活方式",
  P: "心理认知",
  D: "数字健康",
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-brand-soft pt-16">
          <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
