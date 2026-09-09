"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ClipboardList,
  ArrowLeft,
  ChevronRight,
  RotateCw,
  X,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth-store";
import { FunctionalImbalance } from "@/components/report/FunctionalImbalance";
import type { FunctionalSummary } from "@/lib/chli-model";
import { FM_IMBALANCES, FM_QUESTION_BY_ID } from "@/lib/functional-survey/questions";
import {
  computeFunctionalLoad,
  summarizeCategories,
} from "@/lib/functional-survey/derive";
import type { FMCategories } from "@/lib/functional-survey/types";

interface SurveyListItem {
  id: number;
  userId: number | null;
  name: string | null;
  phone: string | null;
  reportCode: string | null;
  userName: string | null;
  userEmail: string | null;
  prevResponseId: number | null;
  createdAt: string;
}

interface SurveyDetail {
  id: number;
  name: string | null;
  phone: string | null;
  reportCode: string | null;
  prevResponseId: number | null;
  createdAt: string;
  answers: Record<string, unknown>;
  scores: {
    imbalances: Parameters<typeof computeFunctionalLoad>[0];
    mainProblems: string[];
  } | null;
  diff: {
    stats: { improved: number; worsened: number; persistent: number; changed: number };
    byCategory: Record<string, { oldRate: number; newRate: number; delta: number; status: string }>;
    byQuestion: Record<string, { old: string; new: string; status: string; section: string }>;
  } | null;
}

/** 由存储的评分快照构建报告展示摘要 */
function buildSummary(detail: SurveyDetail): FunctionalSummary | null {
  if (!detail.scores?.imbalances) return null;
  const im = detail.scores.imbalances;
  const cats = summarizeCategories(im);
  return {
    included: true,
    loadRate: computeFunctionalLoad(im),
    categories: cats,
    mainProblems: detail.scores.mainProblems ?? [],
    interventions: cats
      .filter((c) => c.selected)
      .map((c) => ({
        cat: c.cat,
        name: c.name,
        icon: c.icon,
        ...FM_IMBALANCES[c.cat as FMCategories].intervention,
      })),
    retest: detail.diff
      ? {
          isRetest: true,
          stats: detail.diff.stats,
          byCategory: detail.diff.byCategory,
          highlights: Object.entries(detail.diff.byQuestion)
            .slice(0, 12)
            .map(([qid, v]) => ({
              qid,
              text: FM_QUESTION_BY_ID[qid]?.text ?? qid,
              status: v.status,
              old: v.old,
              new: v.new,
            })),
        }
      : null,
  };
}

export default function CoachSurveysPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SurveyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloading, setDownloading] = useState(false);

  /** 下载该份问卷的结果明细 PDF */
  const downloadDetail = async () => {
    if (!detail || !detail.scores?.imbalances) return;
    setDownloading(true);
    try {
      const { exportSurveyPDF } = await import("@/lib/export/survey-export");
      await exportSurveyPDF({
        answers: detail.answers as never,
        categories: summarizeCategories(detail.scores.imbalances),
        problems: detail.scores.mainProblems ?? [],
        reportCode: detail.reportCode,
        name: detail.name,
        phone: detail.phone,
        createdAt: detail.createdAt,
      });
    } catch (e) {
      console.error("下载问卷明细失败:", e);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== "health_coach" && user.role !== "admin")) {
        router.replace("/");
      }
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || (user.role !== "health_coach" && user.role !== "admin")) return;
    (async () => {
      try {
        const res = await fetch("/api/functional-survey/list");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "加载失败");
          return;
        }
        setRecords(json.records ?? []);
      } catch {
        setError("网络错误");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const openDetail = async (id: number) => {
    setLoadingDetail(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/functional-survey/${id}`);
      const json = await res.json();
      if (res.ok) setDetail(json.record);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft pt-16">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  const summary = detail ? buildSummary(detail) : null;

  return (
    <div className="relative min-h-screen bg-brand-soft pt-16">
      <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" />
      <div className="container-page relative py-10">
        {/* 页头 */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">功能医学问卷记录</h1>
              <p className="text-sm text-ink-600">查看所有问卷提交、失衡评分与复测对比</p>
            </div>
          </div>
          <button onClick={() => router.push("/coach")} className="btn-secondary">
            <ArrowLeft className="h-5 w-5" />
            返回工作台
          </button>
        </div>

        {/* 列表 */}
        <div className="card mt-8 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-ink-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              加载中…
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : records.length === 0 ? (
            <div className="p-16 text-center text-sm text-ink-400">
              暂无问卷提交记录
            </div>
          ) : (
            <>
              {/* 桌面表格 */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-100 bg-brand-50/50 text-left text-xs text-ink-500">
                      <th className="px-6 py-3.5 font-semibold">姓名</th>
                      <th className="px-4 py-3.5 font-semibold">联系方式</th>
                      <th className="px-4 py-3.5 font-semibold">关联报告</th>
                      <th className="px-4 py-3.5 font-semibold">类型</th>
                      <th className="px-4 py-3.5 font-semibold">提交时间</th>
                      <th className="px-4 py-3.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr
                        key={r.id}
                        className="cursor-pointer border-b border-brand-50 transition-colors hover:bg-brand-50/40"
                        onClick={() => openDetail(r.id)}
                      >
                        <td className="px-6 py-3.5 font-semibold text-ink-900">
                          {r.name || r.userName || "未署名"}
                        </td>
                        <td className="px-4 py-3.5 text-ink-600">{r.phone || r.userEmail || "—"}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-brand-600">
                          {r.reportCode || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {r.prevResponseId ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                              <RotateCw className="h-3 w-3" />
                              复测
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              首测
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-ink-500">
                          {new Date(r.createdAt).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <ChevronRight className="ml-auto h-4 w-4 text-ink-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 手机卡片 */}
              <div className="divide-y divide-brand-50 md:hidden">
                {records.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openDetail(r.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors active:bg-brand-50/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-ink-900">
                          {r.name || r.userName || "未署名"}
                        </span>
                        {r.prevResponseId ? (
                          <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                            复测
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            首测
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-xs text-ink-400">
                        {r.phone || r.userEmail || "—"} · {new Date(r.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 详情抽屉 */}
      {(detail || loadingDetail) && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={() => setDetail(null)}
        >
          <div
            className={cn(
              "h-full w-full max-w-3xl overflow-y-auto bg-brand-soft shadow-2xl",
              "animate-fade-in"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <h2 className="text-lg font-bold text-ink-900">
                  {detail?.name || "问卷详情"}
                </h2>
                {detail && (
                  <p className="text-xs text-ink-400">
                    {detail.phone || "未留联系方式"} ·{" "}
                    {new Date(detail.createdAt).toLocaleString("zh-CN")}
                    {detail.reportCode ? ` · 报告 ${detail.reportCode}` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadDetail}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 transition-all hover:border-teal-300 hover:bg-teal-100 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloading ? "生成中…" : "下载问卷明细"}
                </button>
                <button
                  onClick={() => setDetail(null)}
                  className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-brand-50 hover:text-ink-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center gap-3 p-16 text-ink-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  加载详情…
                </div>
              ) : summary ? (
                <div className="[&>*:first-child]:mt-0">
                  <FunctionalImbalance functional={summary} />
                </div>
              ) : (
                <div className="p-16 text-center text-sm text-ink-400">
                  无评分数据
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
