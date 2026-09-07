"use client";

import { useState } from "react";
import {
  ChevronDown,
  UtensilsCrossed,
  Pill,
  HeartPulse,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FunctionalSummary } from "@/lib/chli-model";

interface Props {
  functional: FunctionalSummary;
  /** 下载问卷结果明细（供专业评估） */
  onDownload?: () => void;
  downloading?: boolean;
}

const DIFF_BADGE: Record<string, { label: string; className: string }> = {
  improved: { label: "改善", className: "bg-emerald-100 text-emerald-700" },
  worsened: { label: "加重", className: "bg-red-100 text-red-700" },
  persistent: { label: "持续", className: "bg-amber-100 text-amber-700" },
  changed: { label: "变化", className: "bg-brand-100 text-brand-700" },
};

/** 功能医学失衡评估区块（报告页） */
export function FunctionalImbalance({ functional, onDownload, downloading }: Props) {
  const [openCat, setOpenCat] = useState<string | null>(
    functional.categories.find((c) => c.selected)?.cat ?? null
  );

  const load = functional.loadRate;
  const loadLevel =
    load < 15
      ? { label: "失衡轻微", color: "#16A34A" }
      : load < 30
      ? { label: "轻度失衡", color: "#D97706" }
      : load < 45
      ? { label: "中度失衡", color: "#EA580C" }
      : { label: "明显失衡", color: "#DC2626" };

  return (
    <div className="mt-8 space-y-6">
      {/* 失衡负荷概览 + 七大类别 */}
      <div className="card card-accent p-6 md:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-ink-900">功能医学失衡评估</h3>
              <p className="text-sm text-ink-400">
                基于《功能医学思路》七大核心生理过程失衡分析
              </p>
            </div>
          </div>
          {onDownload && (
            <button
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-700 transition-all hover:border-teal-300 hover:bg-teal-100 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "生成中…" : "下载问卷明细"}
            </button>
          )}
        </div>

        {/* 负荷概览 */}
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-teal-50/60 to-white p-5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-4">
            <div
              className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl text-white shadow-md"
              style={{ backgroundColor: loadLevel.color }}
            >
              <span className="text-2xl font-bold tabular-nums">{load}%</span>
              <span className="text-[10px] opacity-90">失衡率</span>
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: loadLevel.color }}>
                {loadLevel.label}
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-500">
                七大失衡类别综合率的平均值，已作为「功能失衡负荷」计入生活方式维度得分。
              </p>
            </div>
          </div>
        </div>

        {/* 七大类别条形 */}
        <div className="mt-6 space-y-2.5">
          {functional.categories.map((c) => {
            const rate = Math.min(100, Math.max(0, c.rate));
            const high = c.rate >= 30;
            return (
              <div key={c.cat} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-center text-base">{c.icon}</span>
                <span
                  className={cn(
                    "w-24 shrink-0 truncate text-xs font-medium sm:w-28 sm:text-sm",
                    high ? "font-semibold text-ink-900" : "text-ink-500"
                  )}
                  title={c.name}
                >
                  {c.name}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-brand-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      high
                        ? "bg-gradient-to-r from-orange-400 to-red-400"
                        : "bg-gradient-to-r from-teal-400 to-emerald-300"
                    )}
                    style={{ width: `${Math.max(3, rate)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "w-14 shrink-0 text-right text-sm font-bold tabular-nums",
                    high ? "text-orange-600" : "text-ink-400"
                  )}
                >
                  {c.rate}%
                </span>
                {c.selected && (
                  <span className="hidden shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 sm:inline">
                    详查
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 主要问题摘要 */}
      {functional.mainProblems.length > 0 && (
        <div className="card card-accent p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-amber-500 to-orange-400" />
            <div>
              <h3 className="text-lg font-bold text-ink-900">主要问题摘要</h3>
              <p className="text-sm text-ink-400">由问卷答案自动归纳</p>
            </div>
          </div>
          <div className="space-y-2">
            {functional.mainProblems.map((line, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl bg-brand-50/60 px-4 py-2.5 text-sm text-ink-700"
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 干预建议 */}
      {functional.interventions.length > 0 && (
        <div className="card card-accent p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-teal-500 to-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-ink-900">个性化干预建议</h3>
              <p className="text-sm text-ink-400">
                针对主要失衡类别的「饮食 · 营养补充 · 生活方式 · 建议检测」方案
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {functional.interventions.map((iv) => {
              const open = openCat === iv.cat;
              return (
                <div
                  key={iv.cat}
                  className="overflow-hidden rounded-xl border-2 border-brand-100 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenCat(open ? null : iv.cat)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-brand-50/50"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{iv.icon}</span>
                      <span>
                        <span className="block text-sm font-bold text-ink-900">{iv.name}</span>
                        <span className="block text-xs text-ink-400">{iv.summary}</span>
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-ink-400 transition-transform duration-300",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  {open && (
                    <div className="grid gap-4 border-t border-brand-100 bg-brand-soft/50 p-5 md:grid-cols-2">
                      <InterventionGroup icon={<UtensilsCrossed className="h-4 w-4" />} title="饮食调整" color="text-emerald-600" items={iv.diet} />
                      <InterventionGroup icon={<Pill className="h-4 w-4" />} title="营养补充" color="text-brand-600" items={iv.supplements} />
                      <InterventionGroup icon={<HeartPulse className="h-4 w-4" />} title="生活方式" color="text-orange-600" items={iv.lifestyle} />
                      <InterventionGroup icon={<Stethoscope className="h-4 w-4" />} title="建议检测" color="text-purple-600" items={iv.tests} />
                      {iv.notes && (
                        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700 md:col-span-2">
                          注：{iv.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-400">
            干预建议仅供参考，营养补充剂剂量请务必在医生或健康管理师指导下使用。
          </p>
        </div>
      )}

      {/* 复测对比 */}
      {functional.retest && (
        <div className="card card-accent p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="h-8 w-1.5 rounded-full bg-gradient-to-b from-brand-500 to-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-ink-900">复测对比</h3>
              <p className="text-sm text-ink-400">与上一次问卷填写的逐题对比</p>
            </div>
          </div>

          {/* 汇总徽章 */}
          <div className="grid grid-cols-4 gap-2 sm:max-w-md">
            {(
              [
                ["improved", TrendingDown],
                ["worsened", TrendingUp],
                ["persistent", Minus],
                ["changed", Info],
              ] as const
            ).map(([key, Icon]) => (
              <div
                key={key}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-3",
                  DIFF_BADGE[key].className
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-lg font-bold tabular-nums">{functional.retest!.stats[key]}</span>
                <span className="text-[10px] font-medium">{DIFF_BADGE[key].label}</span>
              </div>
            ))}
          </div>

          {/* 类别变化 */}
          <div className="mt-5 space-y-2">
            {Object.entries(functional.retest.byCategory).map(([cat, v]) => {
              const im = functional.categories.find((c) => c.cat === cat);
              if (!im || v.oldRate === 0 && v.newRate === 0) return null;
              const badge = DIFF_BADGE[v.status] ?? DIFF_BADGE.changed;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 px-4 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm text-ink-700">
                    <span>{im.icon}</span>
                    {im.name}
                  </span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className="tabular-nums text-ink-400">
                      {v.oldRate}% → {v.newRate}%
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-bold tabular-nums",
                        v.delta < 0
                          ? "bg-emerald-100 text-emerald-700"
                          : v.delta > 0
                          ? "bg-red-100 text-red-700"
                          : "bg-brand-100 text-ink-500"
                      )}
                    >
                      {v.delta > 0 ? "+" : ""}
                      {v.delta}
                    </span>
                    {v.status !== "stable" && (
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", badge.className)}>
                        {badge.label}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 逐题变化明细 */}
          {functional.retest.highlights.length > 0 && (
            <details className="mt-4 rounded-xl border border-brand-100">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-brand-700">
                查看逐题变化明细（{functional.retest.highlights.length} 项）
              </summary>
              <div className="max-h-72 space-y-1.5 overflow-y-auto border-t border-brand-100 p-4">
                {functional.retest.highlights.map((h) => (
                  <div key={h.qid} className="flex items-start justify-between gap-3 text-xs">
                    <span className="min-w-0 flex-1 truncate text-ink-600" title={h.text}>
                      {h.text}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-400">
                      {h.old || "—"} → {h.new || "—"}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        (DIFF_BADGE[h.status] ?? DIFF_BADGE.changed).className
                      )}
                    >
                      {(DIFF_BADGE[h.status] ?? DIFF_BADGE.changed).label}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function InterventionGroup({
  icon,
  title,
  color,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  items: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className={cn("flex items-center gap-1.5 text-sm font-bold", color)}>
        {icon}
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-600">
            <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", color.replace("text-", "bg-"))} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
