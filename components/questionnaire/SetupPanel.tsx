"use client";

import { useMemo } from "react";
import { Check, Clock, Sparkles, Info, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIMENSIONS, QUESTIONS } from "@/lib/questionnaire-data";
import { FM_MODULES, estimateTotalMinutes, type FMModuleId } from "@/lib/functional-survey/config";
import type { AssessmentConfig } from "@/store/assessment-store";

interface Props {
  config: AssessmentConfig;
  onChange: (config: AssessmentConfig) => void;
  onStart: () => void;
}

/** CHLI 每维度题数与预估用时 */
const DIM_STATS = DIMENSIONS.map((d) => {
  const count = QUESTIONS.filter((q) => q.dimension === d.key).length;
  return { ...d, count, minutes: Math.max(1, Math.ceil(count * 0.25)) };
});

const FM_ICON: Record<FMModuleId, string> = {
  fm_basic: "👤",
  fm_habits: "🚬",
  fm_diet: "🥗",
  fm_exercise: "🏃",
  fm_sleep: "😴",
  fm_disease: "📋",
  fm_discomfort: "🌡️",
  fm_stage1: "🧭",
  fm_stage2: "🔬",
};

/** 评估配置面板：用户选择本次评估包含的问卷模块 */
export function SetupPanel({ config, onChange, onStart }: Props) {
  const toggleDim = (key: string) => {
    const dims = config.chliDimensions.includes(key)
      ? config.chliDimensions.filter((k) => k !== key)
      : [...config.chliDimensions, key];
    // 至少保留一个模块
    if (dims.length === 0 && config.fmModules.length === 0) return;
    onChange({ ...config, chliDimensions: dims });
  };

  const toggleFm = (id: FMModuleId) => {
    const mods = config.fmModules.includes(id)
      ? config.fmModules.filter((m) => m !== id)
      : [...config.fmModules, id];
    // 依赖校验：选 stage2 时自动带上 stage1
    if (mods.includes("fm_stage2") && !mods.includes("fm_stage1")) {
      mods.push("fm_stage1");
    }
    if (mods.length === 0 && config.chliDimensions.length === 0) return;
    onChange({ ...config, fmModules: mods });
  };

  const totalMinutes = useMemo(() => {
    const chliCount = DIM_STATS.filter((d) => config.chliDimensions.includes(d.key)).length;
    return estimateTotalMinutes(config.fmModules, chliCount);
  }, [config]);

  const totalQuestions = useMemo(() => {
    let n = QUESTIONS.filter((q) => config.chliDimensions.includes(q.dimension)).length;
    for (const m of FM_MODULES) {
      if (!config.fmModules.includes(m.id)) continue;
      n += m.id === "fm_stage2" ? 45 : parseInt(m.questionCount) || 0;
    }
    return n;
  }, [config]);

  const stage1Selected = config.fmModules.includes("fm_stage1");

  return (
    <div className="space-y-6">
      {/* 汇总条 */}
      <div className="card card-accent flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-brand-400 p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Layers className="h-8 w-8 opacity-90" />
          <div>
            <p className="text-sm opacity-80">本次评估配置</p>
            <p className="text-xl font-bold">
              {config.chliDimensions.length + config.fmModules.length} 个模块 · 约 {totalMinutes} 分钟
            </p>
          </div>
        </div>
        <div className="text-right text-xs opacity-75">
          <p>共约 {totalQuestions} 题</p>
          <p>进度自动保存 · 随时可暂停</p>
        </div>
      </div>

      {/* CHLI 六维 */}
      <div className="card overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-white p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-ink-900">CHLI 长寿指数评估</h2>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            六大维度问卷与检验数据，计算您的综合长寿指数。可按需选择参与的维度，未选维度不计入总分。
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {DIM_STATS.map((d) => {
            const active = config.chliDimensions.includes(d.key);
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDim(d.key)}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.99]",
                  active
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-brand-100 bg-white hover:border-brand-300"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                    active ? "border-brand-500 bg-brand-500" : "border-brand-200"
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <d.icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-ink-400")} />
                    <span className="text-sm font-semibold text-ink-900">
                      {d.key} · {d.title}
                    </span>
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                      {d.weight}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-500">{d.description}</span>
                  <span className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-400">
                    <Clock className="h-3 w-3" />
                    {d.count} 题 · 约 {d.minutes} 分钟
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 功能医学问卷 */}
      <div className="card overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-r from-teal-50/80 to-white p-5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h2 className="text-lg font-bold text-ink-900">功能医学失衡评估</h2>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
              新增模块
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            基于《功能医学思路》的两段式评估：生活方式详查 + 七大失衡类别定位，生成个性化干预建议（饮食/营养/生活方式/建议检测），并作为「功能失衡负荷」计入长寿指数。
          </p>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {FM_MODULES.map((m) => {
            const active = config.fmModules.includes(m.id);
            const disabledByDep = m.dependsOn?.some((dep) => !config.fmModules.includes(dep));
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleFm(m.id)}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.99]",
                  active
                    ? "border-teal-500 bg-teal-50 shadow-sm"
                    : "border-brand-100 bg-white hover:border-brand-300",
                  disabledByDep && "opacity-70"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                    active ? "border-teal-500 bg-teal-500" : "border-brand-200"
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span>{FM_ICON[m.id]}</span>
                    <span className="text-sm font-semibold text-ink-900">{m.title}</span>
                    {m.recommended && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        推荐
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-500">{m.description}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {m.questionCount} · 约 {m.minutes} 分钟
                    </span>
                    {m.dependsOn && (
                      <span className="flex items-center gap-1 text-teal-600">
                        <Info className="h-3 w-3" />
                        需先完成失衡总体评估
                      </span>
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {stage1Selected && (
          <div className="mx-5 mb-5 flex items-start gap-2 rounded-xl bg-teal-50 px-4 py-3 text-xs text-teal-700">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            完成失衡总体评估后，系统将自动计算七大类别阳性率，并仅对主要失衡类别（阳性率≥30%，2~4 个）呈现专项详查题目。
          </div>
        )}
      </div>

      {/* 开始按钮 */}
      <div className="flex justify-center pb-4">
        <button
          onClick={onStart}
          disabled={config.chliDimensions.length === 0 && config.fmModules.length === 0}
          className="btn-primary px-10 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Sparkles className="h-5 w-5" />
          开始评估（约 {totalMinutes} 分钟）
        </button>
      </div>
    </div>
  );
}
